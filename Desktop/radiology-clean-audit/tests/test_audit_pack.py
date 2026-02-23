"""Audit pack oluşturma ve doğrulama testleri."""
import copy
import os
import pytest

os.environ.setdefault("AUDIT_SECRET", "test-secret-key")

from core.export.audit_pack import (
    build_pack,
    build_agent_pack,
    extract_dsl_from_findings,
    verify_pack_full,
)


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


# ── Form → DSL Bridge Testleri ────────────────────────────────────────────────

class TestExtractDslFromFindings:
    def test_aphe_with_washout_and_capsule(self):
        clinical = {
            "cirrhosis": True,
            "lesions": [{
                "location": "Segment VI",
                "size_mm": "22",
                "arterial_enhancement": "hiperenhansman (non-rim APHE)",
                "washout": True,
                "capsule": True,
            }],
        }
        dsl = extract_dsl_from_findings(clinical)
        assert dsl["arterial_phase"]["hyperenhancement"] is True
        assert dsl["portal_phase"]["washout"] is True
        assert dsl["delayed_phase"]["capsule"] is True
        assert dsl["lesion_size_mm"] == 22
        assert dsl["cirrhosis"] is True

    def test_rim_enhancement_not_aphe(self):
        clinical = {
            "cirrhosis": True,
            "lesions": [{
                "size_mm": "30",
                "arterial_enhancement": "rim enhansman",
                "washout": True,
            }],
        }
        dsl = extract_dsl_from_findings(clinical)
        # rim enhancement ≠ APHE
        assert dsl["arterial_phase"]["hyperenhancement"] is False

    def test_empty_lesions_returns_defaults(self):
        clinical = {"cirrhosis": False, "lesions": []}
        dsl = extract_dsl_from_findings(clinical)
        assert dsl["lesion_size_mm"] == 0
        assert dsl["cirrhosis"] is False

    def test_no_lesions_key_returns_defaults(self):
        clinical = {"cirrhosis": True}
        dsl = extract_dsl_from_findings(clinical)
        assert dsl["lesion_size_mm"] == 0
        assert dsl["cirrhosis"] is True

    def test_multiple_lesions_picks_highest_risk(self):
        clinical = {
            "cirrhosis": True,
            "lesions": [
                {"size_mm": "8", "arterial_enhancement": "", "washout": False, "capsule": False},
                {"size_mm": "25", "arterial_enhancement": "hiperenhansman (non-rim APHE)",
                 "washout": True, "capsule": True},
            ],
        }
        dsl = extract_dsl_from_findings(clinical)
        # Should pick the 25mm lesion with all criteria
        assert dsl["lesion_size_mm"] == 25
        assert dsl["arterial_phase"]["hyperenhancement"] is True

    def test_dwi_restriction_as_ancillary(self):
        clinical = {
            "cirrhosis": True,
            "lesions": [{
                "size_mm": "15",
                "arterial_enhancement": "hiperenhansman (non-rim APHE)",
                "washout": False,
                "capsule": False,
                "dwi_restriction": True,
            }],
        }
        dsl = extract_dsl_from_findings(clinical)
        assert "ancillary_features" in dsl
        assert dsl["ancillary_features"]["restricted_diffusion"] is True

    def test_non_numeric_size_defaults_to_zero(self):
        clinical = {
            "cirrhosis": False,
            "lesions": [{"size_mm": "abc", "arterial_enhancement": ""}],
        }
        dsl = extract_dsl_from_findings(clinical)
        assert dsl["lesion_size_mm"] == 0


class TestExtractDslLiradsIntegration:
    """Bridge fonksiyonunun LI-RADS motoru ile entegrasyon testleri."""

    def test_lr5_from_form_data(self):
        from core.export.audit_pack import run_lirads_decision
        clinical = {
            "cirrhosis": True,
            "lesions": [{
                "size_mm": "22",
                "arterial_enhancement": "hiperenhansman (non-rim APHE)",
                "washout": True,
                "capsule": True,
            }],
        }
        dsl = extract_dsl_from_findings(clinical)
        result = run_lirads_decision(dsl)
        assert result["category"] == "LR-5"

    def test_lr2_from_benign_form_data(self):
        from core.export.audit_pack import run_lirads_decision
        clinical = {
            "cirrhosis": False,
            "lesions": [{
                "size_mm": "12",
                "arterial_enhancement": "hipoenhansman",
                "washout": False,
                "capsule": False,
            }],
        }
        dsl = extract_dsl_from_findings(clinical)
        result = run_lirads_decision(dsl)
        assert result["category"] == "LR-2"


class TestBuildAgentPack:
    def test_agent_pack_contains_report(self):
        clinical = {
            "region": "abdomen",
            "cirrhosis": True,
            "lesions": [{"size_mm": "22", "arterial_enhancement": "hiperenhansman (non-rim APHE)",
                         "washout": True, "capsule": True}],
            "age": "58", "gender": "Erkek", "indication": "HCC?",
        }
        pack = build_agent_pack("AGENT-001", clinical, "Test rapor metni", "http://localhost:8000")
        assert pack["content"]["agent_report"] == "Test rapor metni"
        assert pack["content"]["decision"] == "LR-5 (Definite HCC)"
        assert pack["schema"] == "radiology-clean.audit-pack.v2"

    def test_agent_pack_verifiable(self):
        clinical = {
            "cirrhosis": False,
            "lesions": [{"size_mm": "5", "arterial_enhancement": ""}],
        }
        pack = build_agent_pack("AGENT-002", clinical, "Rapor", "http://localhost:8000")
        result = verify_pack_full(pack)
        assert result["status"] == "VALID"

    def test_agent_pack_preserves_clinical_data(self):
        clinical = {
            "region": "brain",
            "age": "45",
            "gender": "Kadin",
            "indication": "Bas agrisi",
            "risk_factors": "Yok",
            "cirrhosis": False,
            "lesions": [],
        }
        pack = build_agent_pack("AGENT-003", clinical, "Beyin raporu", "http://localhost:8000")
        assert pack["content"]["clinical_data"]["region"] == "brain"
        assert pack["content"]["clinical_data"]["age"] == "45"
