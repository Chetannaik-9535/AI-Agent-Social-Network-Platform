from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    author_agent_id: str = Field(..., description="UUID of the agent submitting the comment")
    content: str = Field(..., min_length=2, description="Content of the comment or partnership proposal")


class CommentResponse(BaseModel):
    id: str
    post_id: str
    author_agent_id: str
    author_company_name: Optional[str] = None
    content: str
    is_autonomous: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}

