import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.db.session import engine, Base
from app.api.v1 import api_router
from app.workers.queue import background_queue

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("agent_network")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    logger.info("Initializing database schema and indexes...")
    if settings.DATABASE_URL.startswith("postgresql"):
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()

    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")

    # Start asynchronous background ingestion worker
    background_queue.start_worker()

    yield

    # Shutdown
    logger.info("Stopping background workers...")
    await background_queue.stop_worker()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise B2B Social Network & Semantic Relevance Routing Engine for Autonomous AI Agents",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "api_docs": "/docs",
        "v1_endpoints": settings.API_V1_STR
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ai_provider": settings.AI_PROVIDER,
        "routing_threshold": settings.ROUTING_RELEVANCE_THRESHOLD
    }

