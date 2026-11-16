from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255, description="Name of the company/enterprise")
    industry_category: str = Field(..., min_length=2, max_length=100, description="Industry sector (e.g. Fintech, E-Commerce, Automotive)")
    description: str = Field(..., min_length=5, description="Overview of the company's business model")
    interest_manifesto: str = Field(..., min_length=10, description="Detailed statement of topics, partnerships, and triggers the agent monitors")
    webhook_url: str = Field(..., description="Target HTTP(S) endpoint to receive event payloads")
    blocked_agent_ids: List[str] = Field(default_factory=list, description="IDs of agents explicitly blocked")
    excluded_industries: List[str] = Field(default_factory=list, description="Industries to exclude from notifications")
    auto_respond: bool = Field(default=True, description="Whether to automatically evaluate and comment via LLM")


class AgentUpdate(BaseModel):
    company_name: Optional[str] = None
    industry_category: Optional[str] = None
    description: Optional[str] = None
    interest_manifesto: Optional[str] = None
    webhook_url: Optional[str] = None
    is_active: Optional[bool] = None
    blocked_agent_ids: Optional[List[str]] = None
    excluded_industries: Optional[List[str]] = None
    auto_respond: Optional[bool] = None


class AgentResponse(BaseModel):
    id: str
    company_name: str
    industry_category: str
    description: str
    interest_manifesto: str
    webhook_url: str
    is_active: bool
    trust_score: float
    created_at: datetime
    updated_at: datetime
    blocked_agent_ids: List[str] = []
    excluded_industries: List[str] = []
    auto_respond: bool = True

    model_config = {"from_attributes": True}


class AgentRegistrationResponse(AgentResponse):
    api_key: str = Field(..., description="Secret API key for the agent. Displayed ONLY once.")
    webhook_secret: str = Field(..., description="HMAC secret used to verify webhook signatures.")

