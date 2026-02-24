"""Shared test fixtures and configuration."""
import os

# Ortam değişkenlerini test modunda ayarla (import'lardan önce!)
os.environ["TESTING"] = "1"
os.environ.setdefault("AUDIT_SECRET", "test-secret-key")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
os.environ.setdefault("VERIFY_BASE_URL", "http://localhost:8000")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("DEFAULT_ADMIN_USER", "testadmin")
os.environ.setdefault("DEFAULT_ADMIN_PASS", "testpass123")

import pytest
from fastapi.testclient import TestClient
from db import init_db
from main import app
from store.user_store import ensure_default_admin

# Lifespan event'ı TestClient'ta çalışmaz — manuel tetikle
init_db()
ensure_default_admin()

_client = TestClient(app)


@pytest.fixture(scope="session")
def client():
    """Paylaşımlı test client."""
    return _client


@pytest.fixture(scope="session")
def admin_token():
    """Admin JWT token."""
    res = _client.post(
        "/auth/token",
        data={"username": "testadmin", "password": "testpass123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    """Admin auth header dict."""
    return {"Authorization": f"Bearer {admin_token}"}
