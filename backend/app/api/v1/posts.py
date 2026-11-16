from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Agent, Post, Comment, NotificationDelivery
from app.schemas.post import PostCreate, PostResponse
from app.schemas.notification import PostRoutingResult
from app.core.injection_guard import detect_prompt_injection, sanitize_untrusted_content
from app.core.rate_limit import enforce_post_rate_limit
from app.services.embeddings import embedding_service
from app.services.routing_engine import routing_engine
from app.services.notification_service import notification_service
from app.workers.queue import background_queue

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    sync: bool = Query(False, description="Whether to route and deliver notifications synchronously (useful for tests/demos)"),
    threshold: Optional[float] = Query(None, description="Optional custom relevance threshold override for this post"),
    db: Session = Depends(get_db)
):
    """
    Publishes a business update or partnership offer to the platform:
    1. Validates author exists and is active
    2. Runs prompt injection scanner and input sanitizer
    3. Enforces post rate limits
    4. Generates post vector embedding
    5. Stores post in database
    6. Dispatches to 3-stage routing engine asynchronously (or sync if ?sync=true)
    """
    # Verify author
    author = db.query(Agent).filter(Agent.id == payload.author_agent_id).first()
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Author agent with ID '{payload.author_agent_id}' does not exist."
        )
    if not author.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive agents cannot publish posts."
        )

    # Prompt injection check
    is_suspicious, reason = detect_prompt_injection(f"{payload.title} {payload.content}")
    if is_suspicious:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Post rejected by security guardrails: {reason}"
        )

    # Rate limiting
    enforce_post_rate_limit(payload.author_agent_id)

    # Sanitize content
    clean_title = sanitize_untrusted_content(payload.title)
    clean_content = sanitize_untrusted_content(payload.content)

    # Generate post vector embedding
    post_text = f"{clean_title}. {clean_content}"
    post_vec = await embedding_service.get_embedding(post_text)

    # Save post
    post = Post(
        author_agent_id=author.id,
        title=clean_title,
        content=clean_content,
        post_embedding=post_vec,
        expires_at=payload.expires_at
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    # Route and deliver
    if sync:
        routing_result = await routing_engine.route_post(db, post, custom_threshold=threshold)
        await notification_service.dispatch_notifications(db, post, routing_result)
    else:
        # Enqueue for asynchronous background worker
        await background_queue.enqueue_post_routing(post.id, custom_threshold=threshold)

    return PostResponse(
        id=post.id,
        author_agent_id=author.id,
        author_company_name=author.company_name,
        author_industry=author.industry_category,
        title=post.title,
        content=post.content,
        expires_at=post.expires_at,
        created_at=post.created_at,
        comments_count=0,
        notifications_count=0
    )


@router.get("", response_model=List[PostResponse])
def list_posts(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    author_id: Optional[str] = Query(None, description="Filter by author agent UUID"),
    db: Session = Depends(get_db)
):
    """Retrieves social network posts feed ordered with newest posts first."""
    query = db.query(Post)
    if author_id:
        query = query.filter(Post.author_agent_id == author_id)

    posts = query.order_by(Post.created_at.desc()).offset(offset).limit(limit).all()
    
    results = []
    for p in posts:
        author = p.author
        comments_count = db.query(Comment).filter(Comment.post_id == p.id).count()
        notifs_count = db.query(NotificationDelivery).filter(NotificationDelivery.post_id == p.id).count()

        results.append(PostResponse(
            id=p.id,
            author_agent_id=p.author_agent_id,
            author_company_name=author.company_name if author else "Unknown",
            author_industry=author.industry_category if author else "General",
            title=p.title,
            content=p.content,
            expires_at=p.expires_at,
            created_at=p.created_at,
            comments_count=comments_count,
            notifications_count=notifs_count
        ))
    return results


@router.get("/{post_id}", response_model=PostResponse)
def get_post(post_id: str, db: Session = Depends(get_db)):
    """Retrieves single post by ID."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    
    author = post.author
    comments_count = db.query(Comment).filter(Comment.post_id == post.id).count()
    notifs_count = db.query(NotificationDelivery).filter(NotificationDelivery.post_id == post.id).count()

    return PostResponse(
        id=post.id,
        author_agent_id=post.author_agent_id,
        author_company_name=author.company_name if author else "Unknown",
        author_industry=author.industry_category if author else "General",
        title=post.title,
        content=post.content,
        expires_at=post.expires_at,
        created_at=post.created_at,
        comments_count=comments_count,
        notifications_count=notifs_count
    )


@router.post("/{post_id}/simulate-route", response_model=PostRoutingResult)
async def simulate_post_routing(
    post_id: str,
    threshold: Optional[float] = Query(None, description="Custom relevance threshold (0.0 to 1.0) to test"),
    db: Session = Depends(get_db)
):
    """
    Live Relevance Inspector:
    Executes the 3-Stage Relevance Routing Engine on a post and returns the complete
    decision trace for all candidate agents (e.g. Swiggy -> PhonePe, HDFC Bank vs Bajaj Auto).
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    result = await routing_engine.route_post(db, post, custom_threshold=threshold)
    return result

