import logging
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, not_

from app.config import settings
from app.db.models import Agent, AgentPreference, Post, RoutingLog
from app.schemas.notification import PostRoutingResult, RoutingTraceItem
from app.services.embeddings import embedding_service, cosine_similarity
from app.services.reranker import relevance_judge

logger = logging.getLogger(__name__)


class RelevanceRoutingEngine:
    """
    Three-Stage B2B Agent Relevance Routing Engine:
    Stage 1: Fast SQL Guardrails (Blocklists, exclusions, active state, author filter)
    Stage 2: Semantic Vector Search (pgvector cosine ANN / top K candidates)
    Stage 3: Deep Cross-Encoder / LLM Relevance Judge with configurable threshold
    """

    async def route_post(
        self,
        db: Session,
        post: Post,
        custom_threshold: Optional[float] = None
    ) -> PostRoutingResult:
        threshold = custom_threshold if custom_threshold is not None else settings.ROUTING_RELEVANCE_THRESHOLD
        
        # Ensure post has an embedding
        if not post.post_embedding:
            post_text = f"{post.title}. {post.content}"
            post.post_embedding = await embedding_service.get_embedding(post_text)
            db.commit()

        # Fetch author details
        author = db.query(Agent).filter(Agent.id == post.author_agent_id).first()
        author_company = author.company_name if author else "Unknown"
        author_industry = author.industry_category if author else "General"

        # Fetch all registered agents to evaluate through the 3-stage funnel
        all_agents = db.query(Agent).all()
        total_candidates = len(all_agents)

        traces: List[RoutingTraceItem] = []
        stage1_eligible_agents: List[Agent] = []

        # =========================================================================
        # STAGE 1: SQL FILTERING & METADATA GUARDRAILS
        # =========================================================================
        for agent in all_agents:
            # Exclude self
            if agent.id == post.author_agent_id:
                traces.append(RoutingTraceItem(
                    target_agent_id=agent.id,
                    target_company_name=agent.company_name,
                    target_industry=agent.industry_category,
                    stage1_passed=False,
                    stage1_reason="Excluded: Agent is the author of this post",
                    vector_score=0.0,
                    rerank_score=0.0,
                    final_decision=False,
                    rejection_reason="Self-authored post"
                ))
                continue

            # Exclude inactive agents
            if not agent.is_active:
                traces.append(RoutingTraceItem(
                    target_agent_id=agent.id,
                    target_company_name=agent.company_name,
                    target_industry=agent.industry_category,
                    stage1_passed=False,
                    stage1_reason="Excluded: Agent account is currently deactivated",
                    vector_score=0.0,
                    rerank_score=0.0,
                    final_decision=False,
                    rejection_reason="Agent inactive"
                ))
                continue

            # Check preference rules: blocked agents and excluded industries
            pref = db.query(AgentPreference).filter(AgentPreference.agent_id == agent.id).first()
            if pref:
                blocked_agents = pref.blocked_agent_ids or []
                excluded_industries = pref.excluded_industries or []

                if post.author_agent_id in blocked_agents:
                    traces.append(RoutingTraceItem(
                        target_agent_id=agent.id,
                        target_company_name=agent.company_name,
                        target_industry=agent.industry_category,
                        stage1_passed=False,
                        stage1_reason=f"Excluded: Target agent blocked author ({author_company})",
                        vector_score=0.0,
                        rerank_score=0.0,
                        final_decision=False,
                        rejection_reason="Blocked author"
                    ))
                    continue

                if author_industry in excluded_industries:
                    traces.append(RoutingTraceItem(
                        target_agent_id=agent.id,
                        target_company_name=agent.company_name,
                        target_industry=agent.industry_category,
                        stage1_passed=False,
                        stage1_reason=f"Excluded: Industry '{author_industry}' is in target's exclusion list",
                        vector_score=0.0,
                        rerank_score=0.0,
                        final_decision=False,
                        rejection_reason="Excluded industry"
                    ))
                    continue

            stage1_eligible_agents.append(agent)

        stage1_count = len(stage1_eligible_agents)

        # =========================================================================
        # STAGE 2: SEMANTIC VECTOR SEARCH (pgvector / Cosine ANN top K)
        # =========================================================================
        scored_candidates: List[Tuple[Agent, float]] = []
        for agent in stage1_eligible_agents:
            if not agent.interest_embedding:
                # Generate embedding if missing
                agent.interest_embedding = await embedding_service.get_embedding(
                    f"{agent.company_name} {agent.industry_category}. {agent.interest_manifesto}"
                )
                db.commit()

            v_score = cosine_similarity(post.post_embedding, agent.interest_embedding)
            scored_candidates.append((agent, v_score))

        # Sort candidates by cosine similarity descending
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        top_k_candidates = scored_candidates[:settings.ROUTING_VECTOR_TOP_K]
        stage2_count = len(top_k_candidates)

        # =========================================================================
        # STAGE 3: HIGH-PRECISION RERANKING / LLM JUDGE
        # =========================================================================
        notified_count = 0
        for agent, v_score in top_k_candidates:
            rerank_score, reason = await relevance_judge.evaluate_relevance(
                post_title=post.title,
                post_content=post.content,
                author_company=author_company,
                target_company=agent.company_name,
                target_industry=agent.industry_category,
                target_manifesto=agent.interest_manifesto,
                vector_score=v_score
            )

            is_relevant = rerank_score >= threshold
            if is_relevant:
                notified_count += 1
                rejection_reason = None
            else:
                rejection_reason = f"Score ({rerank_score:.2f}) below threshold ({threshold:.2f}): {reason}"

            # Audit log to routing_logs table
            routing_log = RoutingLog(
                post_id=post.id,
                target_agent_id=agent.id,
                stage1_passed=True,
                vector_score=round(v_score, 4),
                rerank_score=round(rerank_score, 4),
                final_decision=is_relevant,
                rejection_reason=rejection_reason
            )
            db.add(routing_log)

            traces.append(RoutingTraceItem(
                target_agent_id=agent.id,
                target_company_name=agent.company_name,
                target_industry=agent.industry_category,
                stage1_passed=True,
                vector_score=round(v_score, 4),
                rerank_score=round(rerank_score, 4),
                final_decision=is_relevant,
                rejection_reason=rejection_reason if not is_relevant else None
            ))

        db.commit()

        # Sort traces so notified/high-scoring agents show first
        traces.sort(key=lambda t: (t.final_decision, t.rerank_score), reverse=True)

        return PostRoutingResult(
            post_id=post.id,
            total_candidates=total_candidates,
            stage1_eligible=stage1_count,
            stage2_vector_matches=stage2_count,
            stage3_notified=notified_count,
            threshold_applied=threshold,
            routing_traces=traces
        )


routing_engine = RelevanceRoutingEngine()

