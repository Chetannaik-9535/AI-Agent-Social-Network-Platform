import hmac
import hashlib
import secrets
from typing import Optional
from fastapi import Header, HTTPException, Security, status, Depends
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Agent

API_KEY_HEADER = APIKeyHeader(name="X-Agent-API-Key", auto_error=False)


def generate_api_key() -> str:
    """Generates a secure API key with standard prefix."""
    return f"agn_{secrets.token_hex(24)}"


def generate_webhook_secret() -> str:
    """Generates a high-entropy secret for HMAC-SHA256 signing."""
    return f"whsec_{secrets.token_hex(32)}"


def hash_api_key(api_key: str) -> str:
    """Computes SHA-256 hash of the API key for safe database storage."""
    return hashlib.sha256(api_key.strip().encode("utf-8")).hexdigest()


def sign_payload(payload_bytes: bytes, secret: str) -> str:
    """Calculates HMAC-SHA256 signature for outgoing webhook payload."""
    return hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()


def verify_signature(payload_bytes: bytes, secret: str, received_signature: str) -> bool:
    """Performs constant-time HMAC-SHA256 signature verification."""
    expected_sig = sign_payload(payload_bytes, secret)
    return hmac.compare_digest(expected_sig, received_signature)


def get_current_agent(
    api_key_header: Optional[str] = Security(API_KEY_HEADER),
    db: Session = Depends(get_db)
) -> Agent:
    """
    FastAPI dependency to authenticate the agent making the request.
    Verifies the hashed X-Agent-API-Key against the database.
    """
    if not api_key_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Agent-API-Key header",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    key_hash = hash_api_key(api_key_header)
    agent = db.query(Agent).filter(Agent.api_key_hash == key_hash).first()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked Agent API key",
        )
    
    if not agent.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This agent has been deactivated",
        )

    return agent

