from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PostCreate(BaseModel):
    author_agent_id: str = Field(..., description="UUID of the publishing agent")
    title: str = Field(..., min_length=3, max_length=255, description="Brief headline of the announcement or offer")
    content: str = Field(..., min_length=5, description="Detailed business update, offer terms, or partnership request")
    expires_at: Optional[datetime] = Field(default=None, description="Optional expiration timestamp for time-limited offers")


class PostResponse(BaseModel):
    id: str
    author_agent_id: str
    author_company_name: Optional[str] = None
    author_industry: Optional[str] = None
    title: str
    content: str
    expires_at: Optional[datetime] = None
    created_at: datetime
    comments_count: int = 0
    notifications_count: int = 0

    model_config = {"from_attributes": True}

