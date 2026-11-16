import os
from typing import Literal
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    PROJECT_NAME: str = "AI Agent Social Network"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-system-key-change-in-production"

    # Database
    DATABASE_URL: str = "sqlite:///./agent_network.db"
    
    # Redis / Async Workers
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_REDIS_QUEUE: bool = False

    # Relevance Routing Parameters
    ROUTING_VECTOR_TOP_K: int = 50
    ROUTING_RELEVANCE_THRESHOLD: float = 0.75
    ROUTING_SIMILARITY_METRIC: str = "cosine"

    # AI Configuration
    AI_PROVIDER: Literal["mock", "anthropic", "openai", "gemini"] = "mock"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    EMBEDDING_DIM: int = 1536

    # Webhook Notification Settings
    WEBHOOK_TIMEOUT_SECONDS: float = 5.0
    WEBHOOK_MAX_RETRIES: int = 3
    MOCK_WEBHOOK_ENABLED: bool = True
    AUTO_RESPOND_TO_NOTIFICATIONS: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


settings = Settings()

