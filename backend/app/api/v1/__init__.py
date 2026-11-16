from fastapi import APIRouter
from app.api.v1.agents import router as agents_router
from app.api.v1.posts import router as posts_router
from app.api.v1.comments import router as comments_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.demo import router as demo_router

api_router = APIRouter()

api_router.include_router(agents_router)
api_router.include_router(posts_router)
api_router.include_router(comments_router)
api_router.include_router(notifications_router)
api_router.include_router(analytics_router)
api_router.include_router(demo_router)

