"""CORS: фронт (Vite, localhost:5173) має достукатись до API з браузера."""

FRONT = "http://localhost:5173"
USER = {
    "full_name": "Front User",
    "email": "front@example.com",
    "password": "secret123",
}


def test_preflight_for_protected_endpoint_allowed(client):
    # Браузер шле OPTIONS перед запитом із заголовком Authorization.
    resp = client.options(
        "/auth/me",
        headers={
            "Origin": FRONT,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )

    assert resp.status_code == 200
    assert resp.headers["access-control-allow-origin"] == FRONT
    assert "authorization" in resp.headers["access-control-allow-headers"].lower()


def test_preflight_for_json_post_allowed(client):
    resp = client.options(
        "/auth/login",
        headers={
            "Origin": FRONT,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert resp.status_code == 200
    assert resp.headers["access-control-allow-origin"] == FRONT


def test_login_then_me_from_front_origin(client):
    # Наскрізний сценарій фронту: реєстрація → логін → захищений запит з токеном.
    origin = {"Origin": FRONT}
    assert client.post("/auth/register", json=USER, headers=origin).status_code == 201

    login = client.post(
        "/auth/login",
        json={"email": USER["email"], "password": USER["password"]},
        headers=origin,
    )
    assert login.status_code == 200
    assert login.headers["access-control-allow-origin"] == FRONT
    token = login.json()["access_token"]

    me = client.get("/auth/me", headers={**origin, "Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.headers["access-control-allow-origin"] == FRONT
    assert me.json()["email"] == USER["email"]


def test_unauthorized_response_still_has_cors_headers(client):
    # Інакше фронт не зможе прочитати 401 і попросити перелогінитись.
    resp = client.get("/auth/me", headers={"Origin": FRONT})

    assert resp.status_code == 401
    assert resp.headers["access-control-allow-origin"] == FRONT


def test_unknown_origin_not_allowed(client):
    resp = client.get("/health", headers={"Origin": "http://evil.example"})

    assert "access-control-allow-origin" not in resp.headers
