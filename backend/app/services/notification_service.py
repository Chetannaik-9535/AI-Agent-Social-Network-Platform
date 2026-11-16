import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Any, List
import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import Agent, Post, NotificationDelivery, RoutingLog
from app.schemas.notification import PostRoutingResult
from app.core.security import sign_payload
from app.services.webhook_simulator import webhook_simulator
from app.services.llm_agent_responder import autonomous_responder

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Handles asynchronous HTTP webhook delivery with HMAC-SHA256 signatures,
    exponential backoff retries, delivery tracking, and deduplication.
    """

    async def dispatch_notifications(
        self,
        db: Session,
        post: Post,
        routing_result: PostRoutingResult
    ) -> List[NotificationDelivery]:
        deliveries = []
        author = db.query(Agent).filter(Agent.id == post.author_agent_id).first()
        author_company = author.company_name if author else "Unknown"

        # Filter only candidates that passed Stage 3 (final_decision == True)
        successful_traces = [t for t in routing_result.routing_traces if t.final_decision]

        for trace in successful_traces:
            target_agent = db.query(Agent).filter(Agent.id == trace.target_agent_id).first()
            if not target_agent:
                continue

            # Deduplication: Ensure we don't dispatch duplicate notification for this post to this agent
            existing = db.query(NotificationDelivery).filter(
                NotificationDelivery.post_id == post.id,
                NotificationDelivery.target_agent_id == target_agent.id
            ).first()

            if existing:
                logger.info(f"Duplicate notification suppressed for Agent {target_agent.company_name} on Post {post.id}")
                deliveries.append(existing)
                continue

            # Find matching routing log ID
            routing_log = db.query(RoutingLog).filter(
                RoutingLog.post_id == post.id,
                RoutingLog.target_agent_id == target_agent.id
            ).first()
            routing_log_id = routing_log.id if routing_log else None

            # Construct standardized webhook payload
            payload_data: Dict[str, Any] = {
                "event": "post.relevant",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "post": {
                    "id": post.id,
                    "title": post.title,
                    "content": post.content,
                    "author_agent_id": post.author_agent_id,
                    "author_company": author_company,
                    "created_at": post.created_at.isoformat() if post.created_at else None
                },
                "routing_metadata": {
                    "vector_score": trace.vector_score,
                    "rerank_score": trace.rerank_score,
                    "threshold": routing_result.threshold_applied
                }
            }

            payload_bytes = json.dumps(payload_data, sort_keys=True).encode("utf-8")
            signature = sign_payload(payload_bytes, target_agent.webhook_secret)

            delivery = NotificationDelivery(
                post_id=post.id,
                target_agent_id=target_agent.id,
                routing_log_id=routing_log_id,
                status="PENDING",
                attempts=0,
                payload=payload_data,
                signature=signature
            )
            db.add(delivery)
            db.commit()
            db.refresh(delivery)

            # Deliver webhook (async with retry logic)
            await self._deliver_webhook(db, delivery, target_agent, post, payload_bytes, signature)
            deliveries.append(delivery)

        return deliveries

    async def _deliver_webhook(
        self,
        db: Session,
        delivery: NotificationDelivery,
        target_agent: Agent,
        post: Post,
        payload_bytes: bytes,
        signature: str
    ):
        url = target_agent.webhook_url
        headers = {
            "Content-Type": "application/json",
            "X-Agent-Signature": signature,
            "X-Agent-Timestamp": str(int(time.time())),
            "User-Agent": "AIAgentNetwork/1.0"
        }

        # Check if URL is simulated or mock mode is forced
        is_mock = (
            settings.MOCK_WEBHOOK_ENABLED or
            "mock" in url.lower() or
            "localhost" in url.lower() or
            "example.com" in url.lower()
        )

        success = False
        last_error = None
        http_status = None

        for attempt in range(1, settings.WEBHOOK_MAX_RETRIES + 1):
            delivery.attempts = attempt
            delivery.last_attempt_at = datetime.now(timezone.utc)

            if is_mock:
                # Local mock simulation without external network request
                webhook_simulator.simulate_receive(
                    agent_id=target_agent.id,
                    company_name=target_agent.company_name,
                    payload=delivery.payload,
                    signature=signature
                )
                delivery.status = "DELIVERED"
                delivery.http_status = 200
                success = True
                break
            else:
                try:
                    async with httpx.AsyncClient(timeout=settings.WEBHOOK_TIMEOUT_SECONDS) as client:
                        resp = await client.post(url, content=payload_bytes, headers=headers)
                        http_status = resp.status_code
                        if 200 <= resp.status_code < 300:
                            delivery.status = "DELIVERED"
                            delivery.http_status = http_status
                            success = True
                            break
                        else:
                            last_error = f"HTTP {resp.status_code}: {resp.text[:200]}"
                except Exception as e:
                    last_error = str(e)

            # Exponential backoff: 0.2s * 2^attempt
            if attempt < settings.WEBHOOK_MAX_RETRIES:
                await asyncio.sleep(0.2 * (2 ** attempt))

        if not success:
            delivery.status = "FAILED"
            delivery.http_status = http_status
            delivery.error_message = last_error
            logger.warning(f"Failed webhook delivery to {target_agent.company_name}: {last_error}")

        db.commit()

        # If delivered and auto-respond is active, trigger autonomous agent response
        if delivery.status == "DELIVERED" and settings.AUTO_RESPOND_TO_NOTIFICATIONS:
            await autonomous_responder.evaluate_and_respond(
                db=db,
                target_agent=target_agent,
                post=post,
                notification_delivery=delivery
            )


notification_service = NotificationService()

