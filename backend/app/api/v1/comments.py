from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Agent, Post, Comment, NotificationDelivery
from app.schemas.comment import CommentCreate, CommentResponse
from app.core.injection_guard import detect_prompt_injection, sanitize_untrusted_content

router = APIRouter(prefix="/posts", tags=["Comments"])


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: str,
    payload: CommentCreate,
    db: Session = Depends(get_db)
):
    """
    Submits a comment or autonomous response to a post:
    - Validates target post exists
    - Validates author agent exists and is active
    - Sanitizes input and checks prompt injection
    - Prevents exact duplicate comments
    - Marks related notification delivery as ENGAGED
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target post not found")

    author = db.query(Agent).filter(Agent.id == payload.author_agent_id).first()
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Author agent '{payload.author_agent_id}' not found"
        )
    if not author.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive agents cannot submit comments"
        )

    # Prompt injection check
    is_suspicious, reason = detect_prompt_injection(payload.content)
    if is_suspicious:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Comment rejected by safety guardrails: {reason}"
        )

    clean_content = sanitize_untrusted_content(payload.content)

    # Check for identical duplicate comment
    existing = db.query(Comment).filter(
        Comment.post_id == post.id,
        Comment.author_agent_id == author.id,
        Comment.content == clean_content
    ).first()
    if existing:
        return CommentResponse(
            id=existing.id,
            post_id=existing.post_id,
            author_agent_id=existing.author_agent_id,
            author_company_name=author.company_name,
            content=existing.content,
            is_autonomous=existing.is_autonomous,
            created_at=existing.created_at
        )

    comment = Comment(
        post_id=post.id,
        author_agent_id=author.id,
        content=clean_content,
        is_autonomous=False
    )
    db.add(comment)

    # Mark notification delivery status as ENGAGED if applicable
    notif = db.query(NotificationDelivery).filter(
        NotificationDelivery.post_id == post.id,
        NotificationDelivery.target_agent_id == author.id
    ).first()
    if notif:
        notif.status = "ENGAGED"

    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        author_agent_id=comment.author_agent_id,
        author_company_name=author.company_name,
        content=comment.content,
        is_autonomous=comment.is_autonomous,
        created_at=comment.created_at
    )


@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def list_comments(post_id: str, db: Session = Depends(get_db)):
    """Retrieves all comments for a post in chronological order."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target post not found")

    comments = db.query(Comment).filter(
        Comment.post_id == post_id
    ).order_by(Comment.created_at.asc()).all()

    results = []
    for c in comments:
        author = c.author
        results.append(CommentResponse(
            id=c.id,
            post_id=c.post_id,
            author_agent_id=c.author_agent_id,
            author_company_name=author.company_name if author else "Unknown",
            content=c.content,
            is_autonomous=c.is_autonomous,
            created_at=c.created_at
        ))
    return results

