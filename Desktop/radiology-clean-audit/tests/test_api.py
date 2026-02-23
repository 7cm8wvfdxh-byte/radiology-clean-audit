"""FastAPI endpoint testleri (httpx + TestClient)."""
import os
import pytest

os.environ.setdefault("AUDIT_SECRET", "test-secret-key")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
os.environ.setdefault("VERIFY_BASE_URL", "http://localhost:8000")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("DEFAULT_ADMIN_USER", "testadmin")
os.environ.setdefault("DEFAULT_ADMIN_PASS", "testpass123")

from fastapi.testclient import TestClient
from main import app
from store.user_store import ensure_default_admin

# TestClient'ta lifespan event'ı çalışmaz, manuel tetikle
ensure_default_admin()

client = TestClient(app)

CASE_ID = "API-TEST-001"

ANALYZE_BODY = {
    "arterial_phase": {"hyperenhancement": True},
    "portal_phase": {"washout": True},
    "delayed_phase": {"capsule": True},
    "lesion_size_mm": 22,
    "cirrhosis": True,
}


@pytest.fixture(scope="module")
def auth_headers():
    """Admin token al, tüm testlerde kullan."""
    res = client.post(
        "/auth/token",
        data={"username": "testadmin", "password": "testpass123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestRoot:
    def test_health(self):
        res = client.get("/")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


class TestAuth:
    def test_login_success(self):
        res = client.post(
            "/auth/token",
            data={"username": "testadmin", "password": "testpass123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert res.status_code == 200
        assert "access_token" in res.json()

    def test_login_wrong_password(self):
        res = client.post(
            "/auth/token",
            data={"username": "testadmin", "password": "wrongpass"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert res.status_code == 401

    def test_me_endpoint(self, auth_headers):
        res = client.get("/auth/me", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["username"] == "testadmin"

    def test_protected_route_without_token(self):
        res = client.get("/cases")
        assert res.status_code == 401

    # auth_headers fixture'ı class testlerinde parametre olarak çalışmaz direkt,
    # module fixture kullanıyoruz - bu test fixture ile çağrılıyor
    def test_me_endpoint(self):
        # Token alalım
        login = client.post(
            "/auth/token",
            data={"username": "testadmin", "password": "testpass123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token = login.json()["access_token"]
        res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json()["role"] == "admin"


class TestAnalyze:
    def _token(self):
        res = client.post(
            "/auth/token",
            data={"username": "testadmin", "password": "testpass123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    def test_analyze_returns_pack(self):
        res = client.post(f"/analyze/{CASE_ID}", json=ANALYZE_BODY, headers=self._token())
        assert res.status_code == 200
        data = res.json()
        assert data["case_id"] == CASE_ID
        assert data["schema"] == "radiology-clean.audit-pack.v2"
        assert "signature" in data

    def test_analyze_decision_lr5(self):
        res = client.post(f"/analyze/{CASE_ID}", json=ANALYZE_BODY, headers=self._token())
        assert res.json()["content"]["decision"] == "LR-5 (Definite HCC)"

    def test_analyze_invalid_size_too_large(self):
        body = {**ANALYZE_BODY, "lesion_size_mm": 999}
        res = client.post(f"/analyze/{CASE_ID}", json=body, headers=self._token())
        assert res.status_code == 422

    def test_analyze_invalid_size_negative(self):
        body = {**ANALYZE_BODY, "lesion_size_mm": -1}
        res = client.post(f"/analyze/{CASE_ID}", json=body, headers=self._token())
        assert res.status_code == 422

    def test_analyze_minimal_body(self):
        headers = self._token()
        res = client.post(f"/analyze/MINIMAL-001", json={"lesion_size_mm": 5}, headers=headers)
        assert res.status_code == 200
        assert res.json()["content"]["decision"] == "LR-2 (Probably benign)"

    def test_analyze_without_auth_denied(self):
        res = client.post(f"/analyze/{CASE_ID}", json=ANALYZE_BODY)
        assert res.status_code == 401


class TestGetCase:
    def _token(self):
        res = client.post(
            "/auth/token",
            data={"username": "testadmin", "password": "testpass123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    def setup_method(self):
        self.headers = self._token()
        client.post(f"/analyze/{CASE_ID}", json=ANALYZE_BODY, headers=self.headers)

    def test_get_existing_case(self):
        res = client.get(f"/cases/{CASE_ID}", headers=self.headers)
        assert res.status_code == 200
        assert res.json()["case_id"] == CASE_ID

    def test_get_nonexistent_case(self):
        res = client.get("/cases/NONEXISTENT-999", headers=self.headers)
        assert res.status_code == 404

    def test_list_cases(self):
        res = client.get("/cases", headers=self.headers)
        assert res.status_code == 200
        assert isinstance(res.json(), list)


class TestVerify:
    def _token(self):
        res = client.post(
            "/auth/token",
            data={"username": "testadmin", "password": "testpass123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    def setup_method(self):
        headers = self._token()
        res = client.post(f"/analyze/{CASE_ID}", json=ANALYZE_BODY, headers=headers)
        self.sig = res.json()["signature"]

    def test_valid_signature(self):
        res = client.get(f"/verify/{CASE_ID}?sig={self.sig}")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "VALID"
        assert data["sig_match"] is True

    def test_invalid_signature(self):
        bad_sig = "a" * 64
        res = client.get(f"/verify/{CASE_ID}?sig={bad_sig}")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "VALID"
        assert data["sig_match"] is False

    def test_verify_nonexistent_case(self):
        res = client.get(f"/verify/NONEXISTENT-999?sig=abc")
        assert res.status_code == 404


class TestAgentSave:
    def _token(self):
        res = client.post(
            "/auth/token",
            data={"username": "testadmin", "password": "testpass123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    def test_save_with_lirads_scoring(self):
        body = {
            "case_id": "AGENT-SAVE-001",
            "clinical_data": {
                "region": "abdomen",
                "cirrhosis": True,
                "lesions": [{
                    "location": "Segment VI",
                    "size_mm": "22",
                    "arterial_enhancement": "hiperenhansman (non-rim APHE)",
                    "washout": True,
                    "capsule": True,
                }],
                "age": "58",
                "gender": "Erkek",
                "indication": "HCC?",
            },
            "agent_report": "Bu bir test ajan raporudur.",
        }
        res = client.post("/agent/save", json=body, headers=self._token())
        assert res.status_code == 200
        data = res.json()
        assert data["case_id"] == "AGENT-SAVE-001"
        assert data["content"]["decision"] == "LR-5 (Definite HCC)"
        assert data["content"]["agent_report"] == "Bu bir test ajan raporudur."
        assert "signature" in data

    def test_save_retrievable_as_case(self):
        body = {
            "case_id": "AGENT-SAVE-002",
            "clinical_data": {"cirrhosis": False, "lesions": []},
            "agent_report": "Minimal rapor",
        }
        client.post("/agent/save", json=body, headers=self._token())
        res = client.get("/cases/AGENT-SAVE-002", headers=self._token())
        assert res.status_code == 200
        assert res.json()["content"]["agent_report"] == "Minimal rapor"

    def test_save_without_auth_denied(self):
        body = {
            "case_id": "AGENT-SAVE-003",
            "clinical_data": {},
            "agent_report": "test",
        }
        res = client.post("/agent/save", json=body)
        assert res.status_code == 401

    def test_save_missing_case_id(self):
        body = {
            "clinical_data": {},
            "agent_report": "test",
        }
        res = client.post("/agent/save", json=body, headers=self._token())
        assert res.status_code == 422
