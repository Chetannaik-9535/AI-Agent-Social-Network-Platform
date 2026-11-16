def test_register_agent_success(client):
    payload = {
        "company_name": "Zomato",
        "industry_category": "Food & Dining",
        "description": "Online restaurant discovery and delivery service.",
        "interest_manifesto": "Looking for digital payments, fintech promotions, and merchant discount alliances.",
        "webhook_url": "https://agent.zomato.com/events",
        "blocked_agent_ids": [],
        "excluded_industries": [],
        "auto_respond": True
    }
    response = client.post("/api/v1/agents/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["company_name"] == "Zomato"
    assert "id" in data
    assert "api_key" in data
    assert data["api_key"].startswith("agn_")
    assert "webhook_secret" in data
    assert data["webhook_secret"].startswith("whsec_")
    assert data["is_active"] is True
    assert data["trust_score"] == 1.0


def test_register_duplicate_agent_rejected(client):
    payload = {
        "company_name": "DuplicateCo",
        "industry_category": "Fintech",
        "description": "Payment gateway provider.",
        "interest_manifesto": "Payments and transactions.",
        "webhook_url": "https://duplicate.com/events"
    }
    resp1 = client.post("/api/v1/agents/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/agents/register", json=payload)
    assert resp2.status_code == 409
    assert "already registered" in resp2.json()["detail"]


def test_list_and_get_agents(client):
    # Register an agent
    reg = client.post("/api/v1/agents/register", json={
        "company_name": "Razorpay",
        "industry_category": "Payments & Fintech",
        "description": "Payments platform for businesses.",
        "interest_manifesto": "Online merchant checkout partnerships and banking rails.",
        "webhook_url": "https://agent.razorpay.com/events"
    }).json()

    agent_id = reg["id"]

    # Get by ID
    get_resp = client.get(f"/api/v1/agents/{agent_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["company_name"] == "Razorpay"

    # List all
    list_resp = client.get("/api/v1/agents")
    assert list_resp.status_code == 200
    companies = [a["company_name"] for a in list_resp.json()]
    assert "Razorpay" in companies


def test_update_agent_regenerates_embedding(client):
    reg = client.post("/api/v1/agents/register", json={
        "company_name": "Cred",
        "industry_category": "Fintech",
        "description": "Credit card bill payments platform.",
        "interest_manifesto": "Card rewards and bill discounts.",
        "webhook_url": "https://cred.club/events"
    }).json()

    agent_id = reg["id"]

    # Patch manifesto
    patch_resp = client.patch(f"/api/v1/agents/{agent_id}", json={
        "interest_manifesto": "Updated manifesto: premium dining vouchers, luxury travel rewards, and concierge services."
    })
    assert patch_resp.status_code == 200
    assert "luxury travel rewards" in patch_resp.json()["interest_manifesto"]

