import json
import pytest
from app.db.models import Agent, Post, NotificationDelivery
from app.core.security import sign_payload, verify_signature
from app.services.notification_service import notification_service
from app.schemas.notification import PostRoutingResult, RoutingTraceItem


def test_hmac_sha256_signature_verification():
    secret = "whsec_super_secret_test_key_123456789"
    payload = {"event": "post.relevant", "post_id": "test-uuid-123"}
    payload_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")

    sig = sign_payload(payload_bytes, secret)
    assert len(sig) == 64  # SHA256 hex length
    assert verify_signature(payload_bytes, secret, sig) is True

    # Tampered payload fails
    tampered_bytes = json.dumps({"event": "post.relevant", "post_id": "hacked-uuid"}, sort_keys=True).encode("utf-8")
    assert verify_signature(tampered_bytes, secret, sig) is False

    # Wrong secret fails
    assert verify_signature(payload_bytes, "wrong_secret", sig) is False


@pytest.mark.asyncio
async def test_notification_delivery_and_deduplication(db_session):
    author = Agent(
        company_name="SenderCorp",
        industry_category="Tech",
        description="Tech Co.",
        interest_manifesto="Tech.",
        webhook_url="https://mock.sender.com/events",
        api_key_hash="hash_sender",
        webhook_secret="sec_sender"
    )
    target = Agent(
        company_name="ReceiverCorp",
        industry_category="Fintech",
        description="Fintech Co.",
        interest_manifesto="Fintech.",
        webhook_url="https://mock.receiver.com/events",
        api_key_hash="hash_receiver",
        webhook_secret="sec_receiver"
    )
    db_session.add(author)
    db_session.add(target)
    db_session.commit()

    post = Post(
        author_agent_id=author.id,
        title="Test Update",
        content="Testing notification delivery pipeline."
    )
    db_session.add(post)
    db_session.commit()

    routing_result = PostRoutingResult(
        post_id=post.id,
        total_candidates=1,
        stage1_eligible=1,
        stage2_vector_matches=1,
        stage3_notified=1,
        threshold_applied=0.75,
        routing_traces=[
            RoutingTraceItem(
                target_agent_id=target.id,
                target_company_name=target.company_name,
                target_industry=target.industry_category,
                stage1_passed=True,
                vector_score=0.85,
                rerank_score=0.88,
                final_decision=True
            )
        ]
    )

    # First dispatch -> Should deliver
    deliveries1 = await notification_service.dispatch_notifications(db_session, post, routing_result)
    assert len(deliveries1) == 1
    assert deliveries1[0].status in ["DELIVERED", "ENGAGED"]
    assert deliveries1[0].signature is not None

    # Second dispatch -> Should be deduplicated and not create second delivery
    deliveries2 = await notification_service.dispatch_notifications(db_session, post, routing_result)
    assert len(deliveries2) == 1
    total_in_db = db_session.query(NotificationDelivery).filter(
        NotificationDelivery.post_id == post.id,
        NotificationDelivery.target_agent_id == target.id
    ).count()
    assert total_in_db == 1  # Exactly 1 delivery record in DB!
