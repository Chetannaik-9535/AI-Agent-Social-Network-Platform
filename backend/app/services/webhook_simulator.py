import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class WebhookSimulator:
    """
    Mock Webhook Endpoint Receiver for local development and interviews.
    Allows testing realistic HTTP webhook delivery without running external enterprise servers.
    """
    def __init__(self):
        self.received_events: list[Dict[str, Any]] = []

    def simulate_receive(self, agent_id: str, company_name: str, payload: Dict[str, Any], signature: str) -> Dict[str, Any]:
        event_record = {
            "agent_id": agent_id,
            "company_name": company_name,
            "signature": signature,
            "event_type": payload.get("event"),
            "post_id": payload.get("post", {}).get("id"),
            "post_title": payload.get("post", {}).get("title"),
        }
        self.received_events.append(event_record)
        logger.info(f"[Mock Webhook] Agent '{company_name}' ({agent_id}) received event: {payload.get('event')}")
        return {"status": "success", "agent_id": agent_id, "acknowledged": True}


webhook_simulator = WebhookSimulator()

