import pytest
from app.db.models import Agent, AgentPreference, Post
from app.services.routing_engine import routing_engine
from app.services.embeddings import embedding_service


@pytest.mark.asyncio
async def test_swiggy_diwali_routing_phonepe_hdfc_matched_bajaj_excluded(db_session):
    """
    CORE INTERVIEW REQUIREMENT TEST:
    Swiggy posts: '5% discount on all food deliveries during Diwali.'
    - PhonePe MUST be notified (fintech, payments, merchant cashback, food delivery ties).
    - HDFC Bank MUST be notified (banking, credit cards, merchant partnerships).
    - Bajaj Auto MUST NOT be notified (automotive, motorcycles, engines - irrelevant).
    - Swiggy (author) MUST NOT be notified (self-exclusion).
    """
    # 1. Register Swiggy
    swiggy_manifesto = "Food delivery festive promotions, merchant partnerships, restaurant discounts, and customer dining offers."
    swiggy_vec = await embedding_service.get_embedding(f"Swiggy (Food & Dining): {swiggy_manifesto}")
    swiggy = Agent(
        company_name="Swiggy",
        industry_category="Food & Dining",
        description="On-demand food delivery.",
        interest_manifesto=swiggy_manifesto,
        webhook_url="https://agent.swiggy.com/events",
        interest_embedding=swiggy_vec,
        api_key_hash="hash_swiggy",
        webhook_secret="sec_swiggy"
    )
    db_session.add(swiggy)

    # 2. Register PhonePe
    phonepe_manifesto = "High interest in food delivery discounts, festive consumer promotions, UPI cashback tie-ups, and checkout payment partnerships."
    phonepe_vec = await embedding_service.get_embedding(f"PhonePe (Payments & Fintech): {phonepe_manifesto}")
    phonepe = Agent(
        company_name="PhonePe",
        industry_category="Payments & Fintech",
        description="Digital payments and UPI gateway.",
        interest_manifesto=phonepe_manifesto,
        webhook_url="https://agent.phonepe.com/events",
        interest_embedding=phonepe_vec,
        api_key_hash="hash_phonepe",
        webhook_secret="sec_phonepe"
    )
    db_session.add(phonepe)

    # 3. Register HDFC Bank
    hdfc_manifesto = "Monitors credit card festive offers, dining discounts, merchant cashback alliances, and food delivery reward programs."
    hdfc_vec = await embedding_service.get_embedding(f"HDFC Bank (Banking & Financial Services): {hdfc_manifesto}")
    hdfc = Agent(
        company_name="HDFC Bank",
        industry_category="Banking & Financial Services",
        description="Banking and credit cards.",
        interest_manifesto=hdfc_manifesto,
        webhook_url="https://agent.hdfcbank.com/events",
        interest_embedding=hdfc_vec,
        api_key_hash="hash_hdfc",
        webhook_secret="sec_hdfc"
    )
    db_session.add(hdfc)

    # 4. Register Bajaj Auto
    bajaj_manifesto = "Focuses on automotive dealer networks, two-wheeler spare parts, motorcycle engine diagnostics, and fleet mobility."
    bajaj_vec = await embedding_service.get_embedding(f"Bajaj Auto (Automotive & Mobility): {bajaj_manifesto}")
    bajaj = Agent(
        company_name="Bajaj Auto",
        industry_category="Automotive & Mobility",
        description="Motorcycles and commercial vehicles manufacturer.",
        interest_manifesto=bajaj_manifesto,
        webhook_url="https://agent.bajajauto.com/events",
        interest_embedding=bajaj_vec,
        api_key_hash="hash_bajaj",
        webhook_secret="sec_bajaj"
    )
    db_session.add(bajaj)

    db_session.commit()

    # 5. Swiggy publishes the Diwali post
    post_title = "5% discount on all food deliveries during Diwali"
    post_content = "Swiggy offering flat 5% off on all delivery orders above ₹300 during Diwali festive week. Welcoming checkout payment and card rewards partners."
    post_vec = await embedding_service.get_embedding(f"{post_title}. {post_content}")

    post = Post(
        author_agent_id=swiggy.id,
        title=post_title,
        content=post_content,
        post_embedding=post_vec
    )
    db_session.add(post)
    db_session.commit()

    # 6. Run 3-Stage Relevance Routing Engine with standard 0.75 threshold
    result = await routing_engine.route_post(db_session, post, custom_threshold=0.75)

    # Verify high-level routing counts
    assert result.total_candidates == 4  # Swiggy, PhonePe, HDFC, Bajaj
    assert result.stage1_eligible == 3   # PhonePe, HDFC, Bajaj (Swiggy excluded by Stage 1 self-filter)
    assert result.stage3_notified >= 2   # PhonePe and HDFC Bank

    # Build dictionary of trace results by company name
    traces_by_company = {t.target_company_name: t for t in result.routing_traces}

    # Swiggy: Self post -> Excluded in Stage 1
    assert "Swiggy" in traces_by_company
    assert traces_by_company["Swiggy"].stage1_passed is False
    assert traces_by_company["Swiggy"].final_decision is False

    # PhonePe: Highly relevant -> Passed Stage 1, High Vector Score, High Rerank Score >= 0.75, Final Decision TRUE
    assert "PhonePe" in traces_by_company
    assert traces_by_company["PhonePe"].stage1_passed is True
    assert traces_by_company["PhonePe"].rerank_score >= 0.75
    assert traces_by_company["PhonePe"].final_decision is True, f"PhonePe score was {traces_by_company['PhonePe'].rerank_score}"

    # HDFC Bank: Highly relevant -> Passed Stage 1, High Vector Score, High Rerank Score >= 0.75, Final Decision TRUE
    assert "HDFC Bank" in traces_by_company
    assert traces_by_company["HDFC Bank"].stage1_passed is True
    assert traces_by_company["HDFC Bank"].rerank_score >= 0.75
    assert traces_by_company["HDFC Bank"].final_decision is True, f"HDFC Bank score was {traces_by_company['HDFC Bank'].rerank_score}"

    # Bajaj Auto: Irrelevant -> Passed Stage 1, but Rerank Score < 0.75, Final Decision FALSE
    assert "Bajaj Auto" in traces_by_company
    assert traces_by_company["Bajaj Auto"].stage1_passed is True
    assert traces_by_company["Bajaj Auto"].rerank_score < 0.75, f"Bajaj Auto score was {traces_by_company['Bajaj Auto'].rerank_score}"
    assert traces_by_company["Bajaj Auto"].final_decision is False
    assert traces_by_company["Bajaj Auto"].rejection_reason is not None


@pytest.mark.asyncio
async def test_stage1_preference_exclusion_rules(db_session):
    """Test that Stage 1 respects blocked agents and excluded industries."""
    author = Agent(
        company_name="FintechAuthor",
        industry_category="Payments & Fintech",
        description="Fintech platform.",
        interest_manifesto="Fintech offers.",
        webhook_url="https://fintech.com/events",
        interest_embedding=[0.1] * 1536,
        api_key_hash="hash_a",
        webhook_secret="sec_a"
    )
    db_session.add(author)

    # Candidate with excluded industry
    blocked_target = Agent(
        company_name="TargetExcludeIndustry",
        industry_category="Retail",
        description="Retail chain.",
        interest_manifesto="Retail operations.",
        webhook_url="https://retail.com/events",
        interest_embedding=[0.1] * 1536,
        api_key_hash="hash_b",
        webhook_secret="sec_b"
    )
    db_session.add(blocked_target)
    db_session.commit()

    pref = AgentPreference(
        agent_id=blocked_target.id,
        blocked_agent_ids=[],
        excluded_industries=["Payments & Fintech"]
    )
    db_session.add(pref)
    db_session.commit()

    post = Post(
        author_agent_id=author.id,
        title="Payment Gateway Promo",
        content="Zero processing fees for next 3 months.",
        post_embedding=[0.1] * 1536
    )
    db_session.add(post)
    db_session.commit()

    result = await routing_engine.route_post(db_session, post)
    traces = {t.target_company_name: t for t in result.routing_traces}

    assert traces["TargetExcludeIndustry"].stage1_passed is False
    assert "in target's exclusion list" in traces["TargetExcludeIndustry"].stage1_reason

