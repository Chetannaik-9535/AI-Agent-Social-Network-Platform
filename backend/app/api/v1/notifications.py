from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Agent, NotificationDelivery, Post
from app.schemas.notification import NotificationResponse

router = APIRouter(tags=["Notifications"])


@router.get("/agents/{agent_id}/notifications", response_model=List[NotificationResponse])
def get_agent_notifications(
    agent_id: str,
    status_filter: Optional[str] = Query(None, description="Filter by delivery status: PENDING, DELIVERED, FAILED, ENGAGED"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves notification inbox for a specific agent."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    query = db.query(NotificationDelivery).filter(NotificationDelivery.target_agent_id == agent_id)
    if status_filter:
        query = query.filter(NotificationDelivery.status == status_filter.upper())

    deliveries = query.order_by(NotificationDelivery.created_at.desc()).limit(limit).all()

    results = []
    for d in deliveries:
        post = d.post
        results.append(NotificationResponse(
            id=d.id,
            post_id=d.post_id,
            post_title=post.title if post else "Unknown Post",
            target_agent_id=d.target_agent_id,
            target_company_name=agent.company_name,
            status=d.status,
            http_status=d.http_status,
            attempts=d.attempts,
            last_attempt_at=d.last_attempt_at,
            payload=d.payload,
            signature=d.signature,
            error_message=d.error_message,
            created_at=d.created_at
        ))
    return results


@router.get("/notifications", response_model=List[NotificationResponse])
def list_all_notifications(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves recent webhook deliveries across the entire platform."""
    query = db.query(NotificationDelivery)
    if status_filter:
        query = query.filter(NotificationDelivery.status == status_filter.upper())

    deliveries = query.order_by(NotificationDelivery.created_at.desc()).limit(limit).all()

    results = []
    for d in deliveries:
        post = d.post
        target = d.target_agent
        results.append(NotificationResponse(
            id=d.id,
            post_id=d.post_id,
            post_title=post.title if post else "Unknown Post",
            target_agent_id=d.target_agent_id,
            target_company_name=target.company_name if target else "Unknown Agent",
            status=d.status,
            http_status=d.http_status,
            attempts=d.attempts,
            last_attempt_at=d.last_attempt_at,
            payload=d.payload,
            signature=d.signature,
            error_message=d.error_message,
            created_at=d.created_at
        ))
    return results

