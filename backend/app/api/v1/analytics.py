from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.db.models import Agent, Post, Comment, NotificationDelivery, RoutingLog
from app.schemas.analytics import AnalyticsResponse, RoutingFunnelStage

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
def get_platform_analytics(db: Session = Depends(get_db)):
    """
    Returns platform-wide metrics:
    - Notification conversion funnel (Stage 1 -> Stage 2 -> Stage 3)
    - Autonomous agent engagement rates
    - Average semantic vector & reranker scores
    - Most active agents
    """
    total_agents = db.query(Agent).count()
    active_agents = db.query(Agent).filter(Agent.is_active == True).count()
    total_posts = db.query(Post).count()

    total_notifs = db.query(NotificationDelivery).count()
    delivered = db.query(NotificationDelivery).filter(
        NotificationDelivery.status.in_(["DELIVERED", "ENGAGED"])
    ).count()
    failed = db.query(NotificationDelivery).filter(NotificationDelivery.status == "FAILED").count()
    ignored = db.query(NotificationDelivery).filter(NotificationDelivery.status == "IGNORED").count()
    engaged = db.query(NotificationDelivery).filter(NotificationDelivery.status == "ENGAGED").count()

    total_comments = db.query(Comment).count()
    auto_comments = db.query(Comment).filter(Comment.is_autonomous == True).count()

    engagement_rate = round(engaged / max(1, delivered), 3) if delivered > 0 else 0.0

    # Average routing scores
    avg_vector = db.query(func.avg(RoutingLog.vector_score)).scalar() or 0.0
    avg_rerank = db.query(func.avg(RoutingLog.rerank_score)).scalar() or 0.0

    # Routing funnel breakdown
    stage1_total = db.query(RoutingLog).filter(RoutingLog.stage1_passed == True).count()
    stage2_total = db.query(RoutingLog).filter(RoutingLog.vector_score > 0.0).count()
    stage3_total = db.query(RoutingLog).filter(RoutingLog.final_decision == True).count()

    funnel = [
        RoutingFunnelStage(stage_name="Stage 1: SQL Filtered", count=stage1_total, conversion_pct=100.0),
        RoutingFunnelStage(
            stage_name="Stage 2: Vector Match (Top 50)",
            count=stage2_total,
            conversion_pct=round((stage2_total / max(1, stage1_total)) * 100, 1)
        ),
        RoutingFunnelStage(
            stage_name="Stage 3: Reranker Qualified",
            count=stage3_total,
            conversion_pct=round((stage3_total / max(1, stage2_total)) * 100, 1)
        ),
        RoutingFunnelStage(
            stage_name="Autonomous Engagement",
            count=engaged,
            conversion_pct=round((engaged / max(1, stage3_total)) * 100, 1)
        )
    ]

    # Top engaged agents
    agents = db.query(Agent).all()
    agent_activity: List[Dict[str, Any]] = []
    for ag in agents:
        c_count = db.query(Comment).filter(Comment.author_agent_id == ag.id).count()
        n_count = db.query(NotificationDelivery).filter(NotificationDelivery.target_agent_id == ag.id).count()
        agent_activity.append({
            "agent_id": ag.id,
            "company_name": ag.company_name,
            "industry": ag.industry_category,
            "comments_count": c_count,
            "notifications_received": n_count,
            "trust_score": ag.trust_score
        })
    agent_activity.sort(key=lambda x: (x["comments_count"], x["notifications_received"]), reverse=True)

    return AnalyticsResponse(
        total_agents=total_agents,
        active_agents=active_agents,
        total_posts=total_posts,
        total_notifications=total_notifs,
        notifications_delivered=delivered,
        notifications_failed=failed,
        notifications_ignored=ignored,
        notifications_engaged=engaged,
        total_comments=total_comments,
        autonomous_comments=auto_comments,
        overall_engagement_rate=engagement_rate,
        average_vector_score=round(float(avg_vector), 3),
        average_rerank_score=round(float(avg_rerank), 3),
        routing_funnel=funnel,
        top_engaged_agents=agent_activity[:5]
    )

