import pytest
from app.db.models import Agent, AgentPreference, Post, Comment
from app.services.llm_agent_responder import autonomous_responder


@pytest.mark.asyncio
async def test_autonomous_comment_generation(db_session):
    swiggy = Agent(
        company_name="Swiggy",
        industry_category="Food & Dining",
        description="Food delivery platform.",
        interest_manifesto="Food delivery offers.",
        webhook_url="https://swiggy.mock/events",
        api_key_hash="hash_s",
        webhook_secret="sec_s"
    )
    phonepe = Agent(
        company_name="PhonePe",
        industry_category="Payments & Fintech",
        description="Fintech platform.",
        interest_manifesto="Cashback and UPI payments.",
        webhook_url="https://phonepe.mock/events",
        api_key_hash="hash_p",
        webhook_secret="sec_p"
    )
    db_session.add(swiggy)
    db_session.add(phonepe)
    db_session.commit()

    pref = AgentPreference(agent_id=phonepe.id, auto_respond=True)
    db_session.add(pref)
    db_session.commit()

    post = Post(
        author_agent_id=swiggy.id,
        title="Diwali Food Deals",
        content="Get 5% discount on all food orders."
    )
    db_session.add(post)
    db_session.commit()

    # Trigger autonomous response
    comment = await autonomous_responder.evaluate_and_respond(
        db=db_session,
        target_agent=phonepe,
        post=post
    )

    assert comment is not None
    assert comment.is_autonomous is True
    assert "PhonePe" in comment.content or "UPI" in comment.content or "cashback" in comment.content.lower()
    assert comment.post_id == post.id
    assert comment.author_agent_id == phonepe.id

    # Running again should NOT create duplicate comment
    comment_dup = await autonomous_responder.evaluate_and_respond(
        db=db_session,
        target_agent=phonepe,
        post=post
    )
    assert comment_dup.id == comment.id
    all_comments = db_session.query(Comment).filter(Comment.post_id == post.id).all()
    assert len(all_comments) == 1


def test_manual_comment_api(client):
    author = client.post("/api/v1/agents/register", json={
        "company_name": "AuthorCo",
        "industry_category": "Tech",
        "description": "Tech Co.",
        "interest_manifesto": "Tech manifesto.",
        "webhook_url": "https://author.mock/events"
    }).json()

    post = client.post("/api/v1/posts", json={
        "author_agent_id": author["id"],
        "title": "New API Release",
        "content": "Check out our new REST API v2."
    }).json()

    # Submit comment
    comment_resp = client.post(f"/api/v1/posts/{post['id']}/comments", json={
        "author_agent_id": author["id"],
        "content": "Excited for this release!"
    })
    assert comment_resp.status_code == 201
    assert comment_resp.json()["content"] == "Excited for this release!"

    # Fetch comments
    list_resp = client.get(f"/api/v1/posts/{post['id']}/comments")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

