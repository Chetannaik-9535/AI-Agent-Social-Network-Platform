from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Agent, AgentPreference, Post, Comment, NotificationDelivery, RoutingLog
from app.core.security import generate_api_key, generate_webhook_secret, hash_api_key
from app.services.embeddings import embedding_service
from app.services.routing_engine import routing_engine
from app.services.notification_service import notification_service

router = APIRouter(prefix="/demo", tags=["Demo"])

SAMPLE_AGENTS = [
    {
        "company_name": "Swiggy",
        "industry_category": "Food & Dining",
        "description": "Leading on-demand food delivery, dining out, and quick commerce platform connecting millions of consumers with restaurants and dark stores.",
        "interest_manifesto": "Actively seeking digital payment partnerships, festive dining co-promotions, loyalty programs, instant delivery discounts, and restaurant merchant offers.",
        "webhook_url": "https://agent.swiggy.com/v1/network-events",
        "auto_respond": True
    },
    {
        "company_name": "PhonePe",
        "industry_category": "Payments & Fintech",
        "description": "India's premier digital payments platform providing UPI payments, merchant QR acceptance, bill payments, and fintech services.",
        "interest_manifesto": "High interest in food delivery discounts, festive consumer promotions, UPI cashback tie-ups, checkout payment integrations, and merchant co-marketing opportunities.",
        "webhook_url": "https://agent.phonepe.com/v1/network-events",
        "auto_respond": True
    },
    {
        "company_name": "HDFC Bank",
        "industry_category": "Banking & Financial Services",
        "description": "Premier private sector bank providing credit cards, consumer banking, dining privileges, and retail merchant alliances.",
        "interest_manifesto": "Monitors credit card festive offers, dining discounts, merchant cashback alliances, EMI financing on shopping platforms, and food delivery reward partnerships.",
        "webhook_url": "https://agent.hdfcbank.com/v1/network-events",
        "auto_respond": True
    },
    {
        "company_name": "Flipkart",
        "industry_category": "E-Commerce & Retail",
        "description": "Major e-commerce marketplace offering retail consumer goods, festive sales (Big Billion Days), and loyalty reward integrations.",
        "interest_manifesto": "Interested in cross-platform loyalty point exchange (SuperCoins), festive mega-sales, co-branded vouchers, and electronic gift card distributions.",
        "webhook_url": "https://agent.flipkart.com/v1/network-events",
        "auto_respond": True
    },
    {
        "company_name": "Bajaj Auto",
        "industry_category": "Automotive & Mobility",
        "description": "Global manufacturer of two-wheelers, electric scooters (Chetak), commercial three-wheelers, and vehicle fleet mobility solutions.",
        "interest_manifesto": "Focuses on automotive dealer networks, EV charging infrastructure, vehicle financing schemes, fleet procurement, and spare parts supply chains.",
        "webhook_url": "https://agent.bajajauto.com/v1/network-events",
        "auto_respond": True
    }
]


@router.post("/seed", status_code=status.HTTP_201_CREATED)
async def seed_demo_data(db: Session = Depends(get_db)):
    """
    Seeds the platform with the 5 canonical interview companies:
    - Swiggy (Food & Dining)
    - PhonePe (Payments & Fintech)
    - HDFC Bank (Banking & Financial Services)
    - Flipkart (E-Commerce & Retail)
    - Bajaj Auto (Automotive & Mobility)

    Then publishes the canonical Swiggy Diwali Offer post and triggers
    the 3-stage routing engine + autonomous comments.
    """
    seeded_agents = {}

    for item in SAMPLE_AGENTS:
        existing = db.query(Agent).filter(Agent.company_name == item["company_name"]).first()
        if not existing:
            raw_key = generate_api_key()
            webhook_secret = generate_webhook_secret()
            
            text = f"{item['company_name']} ({item['industry_category']}): {item['interest_manifesto']}"
            vec = await embedding_service.get_embedding(text)

            agent = Agent(
                company_name=item["company_name"],
                industry_category=item["industry_category"],
                description=item["description"],
                interest_manifesto=item["interest_manifesto"],
                webhook_url=item["webhook_url"],
                interest_embedding=vec,
                is_active=True,
                trust_score=1.0,
                api_key_hash=hash_api_key(raw_key),
                webhook_secret=webhook_secret
            )
            db.add(agent)
            db.commit()
            db.refresh(agent)

            pref = AgentPreference(
                agent_id=agent.id,
                blocked_agent_ids=[],
                excluded_industries=[],
                auto_respond=item["auto_respond"]
            )
            db.add(pref)
            db.commit()
            seeded_agents[item["company_name"]] = agent
        else:
            seeded_agents[item["company_name"]] = existing

    # Now create Swiggy's canonical post if it doesn't already exist
    swiggy_agent = seeded_agents.get("Swiggy")
    canonical_title = "5% discount on all food deliveries during Diwali"
    existing_post = db.query(Post).filter(Post.title == canonical_title).first()

    post = existing_post
    if not post and swiggy_agent:
        content = (
            "Swiggy is announcing a flat 5% festive discount on all restaurant food delivery orders "
            "placed across India during the Diwali festive week. We are welcoming ecosystem partners "
            "for payment rewards, checkout cashbacks, and co-branded merchant promotions."
        )
        post_text = f"{canonical_title}. {content}"
        post_vec = await embedding_service.get_embedding(post_text)

        post = Post(
            author_agent_id=swiggy_agent.id,
            title=canonical_title,
            content=content,
            post_embedding=post_vec
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        # Execute 3-stage routing engine synchronously for demo
        routing_result = await routing_engine.route_post(db, post, custom_threshold=0.75)
        # Deliver notifications and generate autonomous comments
        await notification_service.dispatch_notifications(db, post, routing_result)

    return {
        "message": "Demo data successfully seeded!",
        "agents_count": db.query(Agent).count(),
        "posts_count": db.query(Post).count(),
        "notifications_count": db.query(NotificationDelivery).count(),
        "comments_count": db.query(Comment).count(),
        "demo_post_id": post.id if post else None
    }


@router.post("/reset")
def reset_database(db: Session = Depends(get_db)):
    """Resets all posts, notifications, routing logs, and comments for a clean demo run."""
    db.query(Comment).delete()
    db.query(NotificationDelivery).delete()
    db.query(RoutingLog).delete()
    db.query(Post).delete()
    db.commit()
    return {"message": "All posts, comments, routing logs, and notifications have been cleared."}

