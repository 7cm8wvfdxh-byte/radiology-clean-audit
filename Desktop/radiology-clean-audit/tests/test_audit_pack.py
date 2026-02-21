"""Audit pack oluşturma ve doğrulama testleri."""
import copy
import os
import pytest

os.environ.setdefault("AUDIT_SECRET", "test-secret-key")

from core.export.audit_pack import build_pack, verify_pack_full


SAMPLE_DSL = {
    "arterial_phase": {"hyperenhancement": True},
    "portal_phase": {"washout": True},
    "delayed_phase": {"capsule": True},
    "lesion_size_mm": 22,
    "cirrhosis": True,
}


@pytest.fixture
def valid_pack():
    return build_pack("CASE-TEST", SAMPLE_DSL, "http://localhost:8000")


class TestBuildPack:
    def test_schema_version(self, valid_pack):
        assert valid_pack["schema"] == "radiology-clean.audit-pack.v2"

    def test_case_id_preserved(self, valid_pack):
        assert valid_pack["case_id"] == "CASE-TEST"

    def test_decision_present(self, valid_pack):
        assert "decision" in valid_pack["content"]
        assert valid_pack["content"]["decision"] == "LR-5 (Definite HCC)"

    def test_hashes_present(self, valid_pack):
        assert "dsl_sha256" in valid_pack["hashes"]
        assert "decision_sha256" in valid_pack["hashes"]

    def test_signature_present(self, valid_pack):
        assert valid_pack["signature"]
        assert len(valid_pack["signature"]) == 64  # HMAC-SHA256 hex

    def test_verify_url_contains_case_id(self, valid_pack):
        assert "CASE-TEST" in valid_pack["verify_url"]

    def test_generated_at_iso_format(self, valid_pack):
        ts = valid_pack["generated_at"]
        assert ts.endswith("Z")
        assert "T" in ts


class TestVerifyPack:
    def test_valid_pack_passes(self, valid_pack):
        result = verify_pack_full(valid_pack)
        assert result["status"] == "VALID"
        assert result["reasons"] == []
        assert result["hash_mismatches"] == {}

    def test_tampered_decision_detected(self, valid_pack):
        tampered = copy.deepcopy(valid_pack)
        tampered["content"]["decision"] = "LR-2 (Probably benign)"
        result = verify_pack_full(tampered)
        assert result["status"] == "TAMPERED"
        assert "hash_mismatch" in result["reasons"]

    def test_tampered_dsl_detected(self, valid_pack):
        tampered = copy.deepcopy(valid_pack)
        tampered["content"]["dsl"]["lesion_size_mm"] = 5
        result = verify_pack_full(tampered)
        assert result["status"] == "TAMPERED"
        assert "hash_mismatch" in result["reasons"]

    def test_tampered_signature_detected(self, valid_pack):
        tampered = copy.deepcopy(valid_pack)
        tampered["signature"] = "a" * 64
        result = verify_pack_full(tampered)
        assert result["status"] == "TAMPERED"
        assert "signature_mismatch" in result["reasons"]

    def test_missing_signature_detected(self, valid_pack):
        tampered = copy.deepcopy(valid_pack)
        del tampered["signature"]
        result = verify_pack_full(tampered)
        assert result["status"] == "TAMPERED"
        assert "signature_missing" in result["reasons"]

    def test_wrong_schema_detected(self, valid_pack):
        tampered = copy.deepcopy(valid_pack)
        tampered["schema"] = "radiology-clean.audit-pack.v1"
        result = verify_pack_full(tampered)
        assert result["status"] == "TAMPERED"
        assert "schema_mismatch" in result["reasons"]
