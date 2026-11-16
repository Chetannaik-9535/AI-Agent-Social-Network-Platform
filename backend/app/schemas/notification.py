from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    post_id: str
    post_title: Optional[str] = None
    target_agent_id: str
    target_company_name: Optional[str] = None
    status: str
    http_status: Optional[int] = None
    attempts: int
    last_attempt_at: Optional[datetime] = None
    payload: Dict[str, Any]
    signature: str
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RoutingTraceItem(BaseModel):
    target_agent_id: str
    target_company_name: str
    target_industry: str
    stage1_passed: bool
    stage1_reason: Optional[str] = None
    vector_score: float
    rerank_score: float
    final_decision: bool
    rejection_reason: Optional[str] = None


class PostRoutingResult(BaseModel):
    post_id: str
    total_candidates: int
    stage1_eligible: int
    stage2_vector_matches: int
    stage3_notified: int
    threshold_applied: float
    routing_traces: list[RoutingTraceItem]

