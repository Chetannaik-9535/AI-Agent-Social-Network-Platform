import json
import logging
from typing import Dict, Any, Tuple
import httpx
from app.config import settings
from app.core.injection_guard import frame_untrusted_data, sanitize_untrusted_content

logger = logging.getLogger(__name__)

# Cross-industry synergy matrix for enterprise relevance evaluation
# Maps (Post Category or Topic) -> (Target Industry Category) -> base synergy weight
INDUSTRY_SYNERGY_MATRIX = {
    "food & dining": {
        "payments & fintech": 0.85,
        "banking & financial services": 0.80,
        "e-commerce & retail": 0.70,
        "logistics & delivery": 0.75,
        "automotive & mobility": 0.15,
        "manufacturing": 0.10,
        "healthcare": 0.20,
    },
    "e-commerce & retail": {
        "payments & fintech": 0.88,
        "banking & financial services": 0.85,
        "logistics & delivery": 0.80,
        "food & dining": 0.65,
        "automotive & mobility": 0.20,
        "manufacturing": 0.25,
    },
    "payments & fintech": {
        "banking & financial services": 0.90,
        "food & dining": 0.85,
        "e-commerce & retail": 0.88,
        "automotive & mobility": 0.30,
        "logistics & delivery": 0.50,
    },
    "automotive & mobility": {
        "banking & financial services": 0.75,  # Auto loans & insurance
        "payments & fintech": 0.50,
        "manufacturing": 0.85,
        "logistics & delivery": 0.70,
        "food & dining": 0.15,
        "e-commerce & retail": 0.25,
    }
}


class RelevanceJudgeService:
    """
    Stage 3 High-Precision Reranker / Relevance Judge.
    Evaluates deep semantic alignment and mutual business value between
    a post and a candidate agent's declared interest manifesto.
    """
    def __init__(self):
        self.provider = settings.AI_PROVIDER

    async def evaluate_relevance(
        self,
        post_title: str,
        post_content: str,
        author_company: str,
        target_company: str,
        target_industry: str,
        target_manifesto: str,
        vector_score: float
    ) -> Tuple[float, str]:
        """
        Calculates joint reranked relevance score in [0.0, 1.0] and reasoning.
        """
        # If external LLM configured, call API
        if self.provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            try:
                return await self._evaluate_anthropic(
                    post_title, post_content, author_company,
                    target_company, target_industry, target_manifesto
                )
            except Exception as e:
                logger.warning(f"Anthropic judge failed, falling back to local evaluator: {e}")

        if self.provider == "openai" and settings.OPENAI_API_KEY:
            try:
                return await self._evaluate_openai(
                    post_title, post_content, author_company,
                    target_company, target_industry, target_manifesto
                )
            except Exception as e:
                logger.warning(f"OpenAI judge failed, falling back to local evaluator: {e}")

        # High-Fidelity Local Cross-Encoder & Rule Evaluator
        return self._evaluate_local(
            post_title, post_content, author_company,
            target_company, target_industry, target_manifesto, vector_score
        )

    def _evaluate_local(
        self,
        post_title: str,
        post_content: str,
        author_company: str,
        target_company: str,
        target_industry: str,
        target_manifesto: str,
        vector_score: float
    ) -> Tuple[float, str]:
        """
        Fast, deterministic cross-encoder simulation:
        1. Evaluates keyword and intent overlap
        2. Applies cross-industry strategic partnership weights
        3. Fuses vector score and semantic relevance
        """
        post_full = f"{post_title} {post_content}".lower()
        manifesto_lower = target_manifesto.lower()
        target_ind_lower = target_industry.lower()

        # Determine broad category of post
        post_category = "general"
        if any(w in post_full for w in ["food", "dining", "meal", "delivery", "swiggy", "restaurant", "order"]):
            post_category = "food & dining"
        elif any(w in post_full for w in ["shopping", "retail", "flipkart", "sale", "electronics", "fashion"]):
            post_category = "e-commerce & retail"
        elif any(w in post_full for w in ["upi", "payment", "cashback", "wallet", "qr"]):
            post_category = "payments & fintech"
        elif any(w in post_full for w in ["bike", "motorcycle", "car", "scooter", "vehicle", "engine", "auto"]):
            post_category = "automotive & mobility"

        # Check industry affinity
        industry_weight = 0.30
        for cat_key, targets in INDUSTRY_SYNERGY_MATRIX.items():
            if cat_key in post_category or post_category in cat_key:
                for ind_key, weight in targets.items():
                    if ind_key in target_ind_lower or target_ind_lower in ind_key:
                        industry_weight = weight
                        break

        # Compute term synergy between manifesto and post
        post_tokens = set(post_full.split())
        manifesto_tokens = set(manifesto_lower.split())
        direct_matches = post_tokens.intersection(manifesto_tokens)
        keyword_overlap = min(1.0, len(direct_matches) / 5.0)

        # Domain specific synergies
        has_cashback_interest = any(k in manifesto_lower for k in ["cashback", "payment", "upi", "card", "discount", "merchant", "offers"])
        has_festive_offer = any(k in post_full for k in ["diwali", "festive", "discount", "5%", "offer", "sale"])
        
        bonus = 0.0
        if has_cashback_interest and has_festive_offer:
            bonus += 0.25

        # Explicit exclusion penalty if target is automotive and post is food without mobility connection
        is_automotive = any(k in target_ind_lower or k in manifesto_lower for k in ["automotive", "mobility", "motorcycle", "vehicle", "engine"])
        if is_automotive and post_category == "food & dining":
            industry_weight = 0.12
            bonus = -0.30

        # Weighted composite score: 35% vector similarity + 45% industry synergy + 20% intent bonus
        raw_score = (vector_score * 0.35) + (industry_weight * 0.45) + (keyword_overlap * 0.10) + bonus
        rerank_score = round(max(0.05, min(0.98, raw_score)), 3)

        if rerank_score >= settings.ROUTING_RELEVANCE_THRESHOLD:
            reason = (
                f"High partnership affinity between {author_company}'s '{post_title}' "
                f"and {target_company}'s focus on {target_industry}. "
                f"Matches manifesto topics ({', '.join(list(direct_matches)[:3]) or 'promotions/payments'})."
            )
        else:
            reason = (
                f"Low relevance: {target_company} operates in {target_industry} which lacks direct "
                f"commercial synergy with {post_category} updates."
            )

        return rerank_score, reason

    async def _evaluate_anthropic(
        self,
        post_title: str,
        post_content: str,
        author_company: str,
        target_company: str,
        target_industry: str,
        target_manifesto: str
    ) -> Tuple[float, str]:
        system_prompt = (
            "You are an impartial B2B Partnership Relevance Judge for an AI Agent Network. "
            "You will be given an untrusted post payload from a company and the declared interests of a candidate recipient company. "
            "Your task: evaluate whether the post represents a high-value commercial, promotional, or integration partnership opportunity. "
            "Return ONLY a JSON object: {\"relevance_score\": float between 0.0 and 1.0, \"reason\": string}."
        )
        user_message = (
            f"Author Company: {author_company}\n"
            f"Candidate Recipient: {target_company} (Industry: {target_industry})\n"
            f"Recipient Manifesto: {target_manifesto}\n\n"
            f"{frame_untrusted_data(post_title, post_content)}"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 200,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_message}]
                }
            )
            resp.raise_for_status()
            data = resp.json()
            reply_text = data["content"][0]["text"]
            parsed = json.loads(reply_text)
            return float(parsed["relevance_score"]), str(parsed["reason"])

    async def _evaluate_openai(
        self,
        post_title: str,
        post_content: str,
        author_company: str,
        target_company: str,
        target_industry: str,
        target_manifesto: str
    ) -> Tuple[float, str]:
        system_prompt = (
            "You are an enterprise AI relevance judge. Assess commercial synergy between the post and candidate agent interests. "
            "Output valid JSON: {\"relevance_score\": float 0.0-1.0, \"reason\": string}."
        )
        user_message = (
            f"Author: {author_company}\n"
            f"Target: {target_company} ({target_industry})\n"
            f"Manifesto: {target_manifesto}\n"
            f"{frame_untrusted_data(post_title, post_content)}"
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ]
                }
            )
            resp.raise_for_status()
            data = resp.json()
            reply_text = data["choices"][0]["message"]["content"]
            parsed = json.loads(reply_text)
            return float(parsed["relevance_score"]), str(parsed["reason"])


relevance_judge = RelevanceJudgeService()

