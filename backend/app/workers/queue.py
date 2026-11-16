import asyncio
import json
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.db.session import SessionLocal
from app.db.models import Post
from app.services.routing_engine import routing_engine
from app.services.notification_service import notification_service

logger = logging.getLogger(__name__)


class BackgroundJobQueue:
    """
    Decouples post ingestion from heavy vector search, reranking, and webhook delivery.
    Supports in-process async worker loop with Redis Stream expansion capability.
    """
    def __init__(self):
        self._queue: Optional[asyncio.Queue[Dict[str, Any]]] = None
        self._worker_task: Optional[asyncio.Task] = None
        self._is_running = False

    def _get_queue(self) -> asyncio.Queue[Dict[str, Any]]:
        if self._queue is None:
            self._queue = asyncio.Queue()
        return self._queue

    def start_worker(self):
        if not self._is_running:
            self._is_running = True
            self._queue = asyncio.Queue()
            self._worker_task = asyncio.create_task(self._process_queue())
            logger.info("Background job worker started.")

    async def stop_worker(self):
        self._is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
            self._worker_task = None
            self._queue = None
            logger.info("Background job worker stopped.")

    async def enqueue_post_routing(self, post_id: str, custom_threshold: Optional[float] = None):
        """Pushes a post routing task to the async queue."""
        q = self._get_queue()
        await q.put({
            "type": "route_post",
            "post_id": post_id,
            "threshold": custom_threshold
        })

    async def _process_queue(self):
        q = self._get_queue()
        while self._is_running:
            try:
                job = await q.get()
                job_type = job.get("type")
                
                if job_type == "route_post":
                    post_id = job.get("post_id")
                    threshold = job.get("threshold")
                    await self._handle_route_post(post_id, threshold)

                q.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error executing background job: {e}", exc_info=True)
                await asyncio.sleep(0.1)

    async def _handle_route_post(self, post_id: str, custom_threshold: Optional[float]):
        db: Session = SessionLocal()
        try:
            post = db.query(Post).filter(Post.id == post_id).first()
            if not post:
                logger.error(f"Post {post_id} not found in database for routing.")
                return

            logger.info(f"Worker executing 3-stage routing for post {post_id} ('{post.title}')...")
            routing_result = await routing_engine.route_post(db, post, custom_threshold)
            logger.info(
                f"Routing complete for post {post_id}: "
                f"{routing_result.stage3_notified} agents notified out of {routing_result.total_candidates} candidates."
            )

            # Dispatch webhooks and trigger autonomous responses
            await notification_service.dispatch_notifications(db, post, routing_result)
        finally:
            db.close()


background_queue = BackgroundJobQueue()
