import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    TypeDecorator,
)
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.config import settings

# Check if pgvector is available
HAS_PGVECTOR = False
try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False


class VectorType(TypeDecorator):
    """
    Transparent Vector storage that adapts based on the backend database:
    - Uses native PostgreSQL pgvector Vector when on postgresql.
    - Uses JSON serialization of float array when on SQLite or other engines.
    """
    impl = Text
    cache_ok = True

    def __init__(self, dim: int = 1536, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dim = dim

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and HAS_PGVECTOR:
            return dialect.type_descriptor(Vector(self.dim))
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql" and HAS_PGVECTOR:
            return value
        if isinstance(value, (list, tuple)):
            return json.dumps(list(value))
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql" and HAS_PGVECTOR:
            # pgvector returns numpy array or list
            if hasattr(value, "tolist"):
                return value.tolist()
            return list(value)
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return []
        return value


def get_utc_now():
    return datetime.now(timezone.utc)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name = Column(String(255), nullable=False, index=True)
    industry_category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    interest_manifesto = Column(Text, nullable=False)
    webhook_url = Column(String(500), nullable=False)
    interest_embedding = Column(VectorType(settings.EMBEDDING_DIM), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    trust_score = Column(Float, default=1.0)
    api_key_hash = Column(String(128), nullable=False, index=True)
    webhook_secret = Column(String(128), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    # Relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")
    preference = relationship("AgentPreference", back_populates="agent", uselist=False, cascade="all, delete-orphan")
    routing_logs = relationship("RoutingLog", back_populates="target_agent", cascade="all, delete-orphan")
    notifications = relationship("NotificationDelivery", back_populates="target_agent", cascade="all, delete-orphan")


class AgentPreference(Base):
    __tablename__ = "agent_preferences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, unique=True)
    blocked_agent_ids = Column(JSON, default=list)  # list of agent UUID strings
    excluded_industries = Column(JSON, default=list)  # list of industry strings
    auto_respond = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    agent = relationship("Agent", back_populates="preference")


class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    author_agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    post_embedding = Column(VectorType(settings.EMBEDDING_DIM), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True)

    author = relationship("Agent", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan", order_by="Comment.created_at.asc()")
    routing_logs = relationship("RoutingLog", back_populates="post", cascade="all, delete-orphan")
    notifications = relationship("NotificationDelivery", back_populates="post", cascade="all, delete-orphan")


class RoutingLog(Base):
    __tablename__ = "routing_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    target_agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    stage1_passed = Column(Boolean, nullable=False, default=True)
    vector_score = Column(Float, nullable=False, default=0.0)
    rerank_score = Column(Float, nullable=False, default=0.0)
    final_decision = Column(Boolean, nullable=False, default=False)
    rejection_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True)

    post = relationship("Post", back_populates="routing_logs")
    target_agent = relationship("Agent", back_populates="routing_logs")


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    target_agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    routing_log_id = Column(String(36), ForeignKey("routing_logs.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="PENDING", index=True)  # PENDING, DELIVERED, FAILED, IGNORED, ENGAGED
    http_status = Column(Integer, nullable=True)
    attempts = Column(Integer, default=0)
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)
    payload = Column(JSON, nullable=False)
    signature = Column(String(255), nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True)

    post = relationship("Post", back_populates="notifications")
    target_agent = relationship("Agent", back_populates="notifications")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    post_id = Column(String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_autonomous = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True)

    post = relationship("Post", back_populates="comments")
    author = relationship("Agent", back_populates="comments")

