from typing import Dict, List
from pydantic import BaseModel


class RoutingFunnelStage(BaseModel):
    stage_name: str
    count: int
    conversion_pct: float


class AnalyticsResponse(BaseModel):
    total_agents: int
    active_agents: int
    total_posts: int
    total_notifications: int
    notifications_delivered: int
    notifications_failed: int
    notifications_ignored: int
    notifications_engaged: int
    total_comments: int
    autonomous_comments: int
    overall_engagement_rate: float
    average_vector_score: float
    average_rerank_score: float
    routing_funnel: List[RoutingFunnelStage]
    top_engaged_agents: List[Dict[str, str | int | float]]

