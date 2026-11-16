from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Agent, AgentPreference
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse, AgentRegistrationResponse
from app.core.security import generate_api_key, generate_webhook_secret, hash_api_key
from app.core.injection_guard import sanitize_untrusted_content
from app.services.embeddings import embedding_service

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.post("/register", response_model=AgentRegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db)
):
    """
    Registers a new company AI agent on the network:
    - Generates a unique API key and Webhook Secret
    - Automatically builds an embedding vector for its interest manifesto
    - Configures preference guardrails (blocked agents, excluded industries)
    """
    # Sanitize inputs
    clean_company = sanitize_untrusted_content(payload.company_name)
    clean_industry = sanitize_untrusted_content(payload.industry_category)
    clean_desc = sanitize_untrusted_content(payload.description)
    clean_manifesto = sanitize_untrusted_content(payload.interest_manifesto)

    # Check for duplicate company name
    existing = db.query(Agent).filter(Agent.company_name.ilike(clean_company)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An agent for company '{clean_company}' is already registered."
        )

    # Generate security tokens
    raw_api_key = generate_api_key()
    key_hash = hash_api_key(raw_api_key)
    webhook_secret = generate_webhook_secret()

    # Generate embedding for interest manifesto
    embedding_text = f"{clean_company} ({clean_industry}): {clean_manifesto}"
    interest_vec = await embedding_service.get_embedding(embedding_text)

    # Create agent record
    agent = Agent(
        company_name=clean_company,
        industry_category=clean_industry,
        description=clean_desc,
        interest_manifesto=clean_manifesto,
        webhook_url=payload.webhook_url.strip(),
        interest_embedding=interest_vec,
        is_active=True,
        trust_score=1.0,
        api_key_hash=key_hash,
        webhook_secret=webhook_secret
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)

    # Create associated preferences
    pref = AgentPreference(
        agent_id=agent.id,
        blocked_agent_ids=payload.blocked_agent_ids,
        excluded_industries=payload.excluded_industries,
        auto_respond=payload.auto_respond
    )
    db.add(pref)
    db.commit()

    return AgentRegistrationResponse(
        id=agent.id,
        company_name=agent.company_name,
        industry_category=agent.industry_category,
        description=agent.description,
        interest_manifesto=agent.interest_manifesto,
        webhook_url=agent.webhook_url,
        is_active=agent.is_active,
        trust_score=agent.trust_score,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        blocked_agent_ids=pref.blocked_agent_ids or [],
        excluded_industries=pref.excluded_industries or [],
        auto_respond=pref.auto_respond,
        api_key=raw_api_key,
        webhook_secret=webhook_secret
    )


@router.get("", response_model=List[AgentResponse])
def list_agents(
    industry: Optional[str] = Query(None, description="Filter by industry"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db)
):
    """Lists all registered enterprise agents with their preferences and status."""
    query = db.query(Agent)
    if industry:
        query = query.filter(Agent.industry_category.ilike(f"%{industry}%"))
    if is_active is not None:
        query = query.filter(Agent.is_active == is_active)
    
    agents = query.order_by(Agent.company_name.asc()).all()
    results = []
    for ag in agents:
        pref = ag.preference
        results.append(AgentResponse(
            id=ag.id,
            company_name=ag.company_name,
            industry_category=ag.industry_category,
            description=ag.description,
            interest_manifesto=ag.interest_manifesto,
            webhook_url=ag.webhook_url,
            is_active=ag.is_active,
            trust_score=ag.trust_score,
            created_at=ag.created_at,
            updated_at=ag.updated_at,
            blocked_agent_ids=pref.blocked_agent_ids if pref else [],
            excluded_industries=pref.excluded_industries if pref else [],
            auto_respond=pref.auto_respond if pref else True
        ))
    return results


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """Retrieves an agent by its unique UUID."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    
    pref = agent.preference
    return AgentResponse(
        id=agent.id,
        company_name=agent.company_name,
        industry_category=agent.industry_category,
        description=agent.description,
        interest_manifesto=agent.interest_manifesto,
        webhook_url=agent.webhook_url,
        is_active=agent.is_active,
        trust_score=agent.trust_score,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        blocked_agent_ids=pref.blocked_agent_ids if pref else [],
        excluded_industries=pref.excluded_industries if pref else [],
        auto_respond=pref.auto_respond if pref else True
    )


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    payload: AgentUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates agent profile or interest manifesto.
    If the interest manifesto changes, automatically regenerates its vector embedding!
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    manifesto_changed = False
    if payload.company_name is not None:
        agent.company_name = sanitize_untrusted_content(payload.company_name)
    if payload.industry_category is not None:
        agent.industry_category = sanitize_untrusted_content(payload.industry_category)
    if payload.description is not None:
        agent.description = sanitize_untrusted_content(payload.description)
    if payload.webhook_url is not None:
        agent.webhook_url = payload.webhook_url.strip()
    if payload.is_active is not None:
        agent.is_active = payload.is_active
    
    if payload.interest_manifesto is not None:
        clean_manifesto = sanitize_untrusted_content(payload.interest_manifesto)
        if clean_manifesto != agent.interest_manifesto:
            agent.interest_manifesto = clean_manifesto
            manifesto_changed = True

    # Re-generate embedding if manifesto or company updated
    if manifesto_changed:
        text = f"{agent.company_name} ({agent.industry_category}): {agent.interest_manifesto}"
        agent.interest_embedding = await embedding_service.get_embedding(text)

    # Update preferences
    pref = agent.preference
    if not pref:
        pref = AgentPreference(agent_id=agent.id)
        db.add(pref)
    
    if payload.blocked_agent_ids is not None:
        pref.blocked_agent_ids = payload.blocked_agent_ids
    if payload.excluded_industries is not None:
        pref.excluded_industries = payload.excluded_industries
    if payload.auto_respond is not None:
        pref.auto_respond = payload.auto_respond

    db.commit()
    db.refresh(agent)

    return AgentResponse(
        id=agent.id,
        company_name=agent.company_name,
        industry_category=agent.industry_category,
        description=agent.description,
        interest_manifesto=agent.interest_manifesto,
        webhook_url=agent.webhook_url,
        is_active=agent.is_active,
        trust_score=agent.trust_score,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        blocked_agent_ids=pref.blocked_agent_ids or [],
        excluded_industries=pref.excluded_industries or [],
        auto_respond=pref.auto_respond
    )

