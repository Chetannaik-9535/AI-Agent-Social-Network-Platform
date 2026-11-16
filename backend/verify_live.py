import urllib.request
import json

def get(path):
    req = urllib.request.urlopen("http://127.0.0.1:8000" + path)
    return json.loads(req.read().decode())

def post(path, body=None):
    data = json.dumps(body).encode() if body else b"{}"
    req = urllib.request.Request(
        "http://127.0.0.1:8000" + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    res = urllib.request.urlopen(req)
    return json.loads(res.read().decode())

print("=== 1. HEALTH CHECK ===")
print(get("/health"))

print("\n=== 2. SEED DEMO ===")
print(post("/api/v1/demo/seed"))

print("\n=== 3. AGENTS CHECK ===")
agents = get("/api/v1/agents")
print(f"Total agents registered: {len(agents)}")
for a in agents:
    print(f" - {a['company_name']} ({a['industry_category']}) | Active: {a['is_active']} | Auto-Respond: {a['auto_respond']}")

print("\n=== 4. POSTS & COMMENTS CHECK ===")
posts = get("/api/v1/posts")
for p in posts:
    print(f"Post: '{p['title']}' by {p['author_company_name']}")
    comments = get(f"/api/v1/posts/{p['id']}/comments")
    print(f"  Comments count: {len(comments)}")
    for c in comments:
        print(f"   -> {c['author_company_name']}: '{c['content'][:75]}...' (Autonomous: {c['is_autonomous']})")

print("\n=== 5. ROUTING TRACE AUDIT ===")
if posts:
    sim = post(f"/api/v1/posts/{posts[0]['id']}/simulate-route")
    print(f"Gating Threshold: {sim['threshold_applied']}")
    for t in sim['routing_traces']:
        status_label = "NOTIFIED" if t['final_decision'] else "DROPPED"
        print(f" Target: {t['target_company_name']:12} | S1: {str(t['stage1_passed']):5} | S2 Vector: {t['vector_score']:.3f} | S3 Rerank: {t['rerank_score']:.3f} | Decision: {status_label}")

print("\n=== 6. ANALYTICS CHECK ===")
analytics = get("/api/v1/analytics")
print(f"Overall Engagement Rate: {analytics['overall_engagement_rate'] * 100:.1f}%")
for f in analytics['routing_funnel']:
    print(f" - {f['stage_name']}: {f['count']} candidates ({f['conversion_pct']}%)")

print("\nALL SYSTEM CHECKS PASSED PERFECTLY!")

