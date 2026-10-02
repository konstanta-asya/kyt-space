import time

import jwt
import pytest
from fastapi import Depends

from app.core.config import settings
from app.main import app
from app.modules.auth.dependencies import require_role
from app.modules.auth.models import Role, User

USER = {"full_name": "Test User", "email": "test@example.com", "password": "secret123", "phone": "+380"}


def register(client, **overrides):
    return client.post("/auth/register", json={**USER, **overrides})


def login(client, email=USER["email"], password=USER["password"]):
    return client.post("/auth/login", json={"email": email, "password": password})


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def token(client):
    register(client)
    return login(client).json()["access_token"]


# --- AUTH-1: реєстрація


def test_register_creates_user(client, db):
    resp = register(client)

    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == USER["email"]
    assert body["role"] == "client"
    assert "password" not in body and "password_hash" not in body

    user = db.query(User).filter_by(email=USER["email"]).one()
    assert user.password_hash != USER["password"]
    assert user.password_hash.startswith("$2b$")


def test_register_duplicate_email_returns_400(client):
    register(client)
    resp = register(client, email="TEST@example.com")

    assert resp.status_code == 400


def test_register_ignores_role_from_request(client):
    resp = register(client, role="superadmin")

    assert resp.status_code == 201
    assert resp.json()["role"] == "client"


@pytest.mark.parametrize(
    "overrides",
    [{"password": "1234567"}, {"email": "not-an-email"}, {"full_name": ""}],
)
def test_register_validation(client, overrides):
    assert register(client, **overrides).status_code == 422


# --- AUTH-2: логін + JWT


def test_login_returns_token_with_user_id_and_role(client):
    user_id = register(client).json()["id"]
    resp = login(client)

    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    payload = jwt.decode(body["access_token"], settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    assert payload["user_id"] == user_id
    assert payload["role"] == "client"
    assert payload["exp"] > time.time()


def test_login_email_is_case_insensitive(client):
    register(client)
    assert login(client, email="Test@Example.com").status_code == 200


@pytest.mark.parametrize(
    "email, password",
    [(USER["email"], "wrong-password"), ("ghost@example.com", USER["password"])],
    ids=["wrong-password", "unknown-email"],
)
def test_login_invalid_credentials_returns_401(client, email, password):
    register(client)
    resp = login(client, email=email, password=password)

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid email or password"


# --- AUTH-3: /auth/me + ролі


def test_me_returns_current_user(client, token):
    resp = client.get("/auth/me", headers=auth_header(token))

    assert resp.status_code == 200
    assert resp.json()["email"] == USER["email"]


def make_token(**payload):
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@pytest.mark.parametrize(
    "headers",
    [
        {},
        auth_header("not-a-jwt"),
        auth_header(make_token(user_id=1, role="client", exp=int(time.time()) - 10)),
        auth_header(jwt.encode({"user_id": 1, "role": "client"}, "other-secret-" * 3, algorithm="HS256")),
        auth_header(make_token(role="client")),
        {"Authorization": "Basic dXNlcjpwYXNz"},
    ],
    ids=["no-token", "garbage", "expired", "wrong-secret", "no-user-id", "not-bearer"],
)
def test_me_invalid_token_returns_401(client, headers):
    assert client.get("/auth/me", headers=headers).status_code == 401


def test_me_deleted_user_returns_401(client, db, token):
    db.query(User).delete()
    db.flush()

    assert client.get("/auth/me", headers=auth_header(token)).status_code == 401


@pytest.fixture
def role_routes():
    @app.get("/_test/manager", dependencies=[Depends(require_role("manager"))])
    def manager_only():
        return {"ok": True}

    @app.get("/_test/client", dependencies=[Depends(require_role(Role.CLIENT, Role.ADMIN))])
    def client_or_admin():
        return {"ok": True}

    added = app.router.routes[-2:]
    yield
    for route in added:
        app.router.routes.remove(route)


def test_require_role_forbids_other_roles(client, token, role_routes):
    assert client.get("/_test/manager", headers=auth_header(token)).status_code == 403


def test_require_role_allows_listed_roles(client, token, role_routes):
    assert client.get("/_test/client", headers=auth_header(token)).status_code == 200


def test_require_role_without_token_returns_401(client, role_routes):
    assert client.get("/_test/manager").status_code == 401


def test_require_role_uses_role_from_db(client, db, token, role_routes):
    db.query(User).update({"role": "manager"})
    db.flush()

    # у токені досі role=client, але права беруться з актуального запису в БД
    assert client.get("/_test/manager", headers=auth_header(token)).status_code == 200
