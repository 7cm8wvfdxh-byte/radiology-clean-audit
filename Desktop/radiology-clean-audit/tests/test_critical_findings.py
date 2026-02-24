"""Critical findings engine unit tests."""
import os

os.environ.setdefault("AUDIT_SECRET", "test-secret-key")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")

from core.critical_findings import detect_critical_findings


class TestLiradsCriticalFindings:
    """LI-RADS kategorilerine göre kritik bulgu tespiti."""

    def test_lr5_returns_critical(self):
        findings = detect_critical_findings({}, {"category": "LR-5"})
        assert len(findings) >= 1
        assert findings[0]["level"] == "critical"
        assert findings[0]["code"] == "LIRADS_5"

    def test_lr_tiv_returns_critical(self):
        findings = detect_critical_findings({}, {"category": "LR-TIV"})
        assert len(findings) >= 1
        assert findings[0]["level"] == "critical"
        assert findings[0]["code"] == "LIRADS_TIV"

    def test_lr_m_returns_urgent(self):
        findings = detect_critical_findings({}, {"category": "LR-M"})
        assert len(findings) >= 1
        assert findings[0]["level"] == "urgent"
        assert findings[0]["code"] == "LIRADS_M"

    def test_lr4_returns_significant(self):
        findings = detect_critical_findings({}, {"category": "LR-4"})
        assert len(findings) >= 1
        assert findings[0]["level"] == "significant"
        assert findings[0]["code"] == "LIRADS_4"

    def test_lr3_returns_significant(self):
        findings = detect_critical_findings({}, {"category": "LR-3"})
        assert len(findings) >= 1
        assert findings[0]["level"] == "significant"
        assert findings[0]["code"] == "LIRADS_3"

    def test_lr2_returns_empty(self):
        findings = detect_critical_findings({}, {"category": "LR-2"})
        assert len(findings) == 0

    def test_lr1_returns_empty(self):
        findings = detect_critical_findings({}, {"category": "LR-1"})
        assert len(findings) == 0

    def test_no_lirads_result(self):
        findings = detect_critical_findings({})
        assert len(findings) == 0


class TestAbdomenFindings:
    """Abdomen spesifik kritik bulgular."""

    def test_tumor_in_vein_without_lirads(self):
        data = {"lesions": [{"tumor_in_vein": True}]}
        findings = detect_critical_findings(data)
        assert any(f["code"] == "TUMOR_IN_VEIN" for f in findings)

    def test_tumor_in_vein_with_lirads_tiv_no_duplicate(self):
        data = {"lesions": [{"tumor_in_vein": True}]}
        findings = detect_critical_findings(data, {"category": "LR-TIV"})
        codes = [f["code"] for f in findings]
        assert "LIRADS_TIV" in codes
        # TUMOR_IN_VEIN should not duplicate LIRADS_TIV
        assert codes.count("TUMOR_IN_VEIN") == 0


class TestBrainFindings:
    """Beyin MRI kritik bulgular."""

    def test_midline_shift(self):
        data = {"brain_lesions": [{"midline_shift": True}]}
        findings = detect_critical_findings(data)
        assert any(f["code"] == "MIDLINE_SHIFT" for f in findings)
        assert findings[0]["level"] == "critical"

    def test_mass_effect_with_edema(self):
        data = {"brain_lesions": [{"mass_effect": True, "perilesional_edema": True}]}
        findings = detect_critical_findings(data)
        assert any(f["code"] == "MASS_EFFECT_EDEMA" for f in findings)

    def test_mass_effect_without_edema(self):
        """Mass effect alone (no edema) should not trigger."""
        data = {"brain_lesions": [{"mass_effect": True, "perilesional_edema": False}]}
        findings = detect_critical_findings(data)
        assert not any(f["code"] == "MASS_EFFECT_EDEMA" for f in findings)


class TestSpineFindings:
    """Spinal MRI kritik bulgular."""

    def test_cord_compression(self):
        data = {"spine_lesions": [{"cord_compression": True}]}
        findings = detect_critical_findings(data)
        assert any(f["code"] == "CORD_COMPRESSION" for f in findings)
        assert findings[0]["level"] == "critical"

    def test_unstable_fracture(self):
        data = {"spine_lesions": [{"cord_compression": True, "vertebral_fracture": True}]}
        findings = detect_critical_findings(data)
        codes = [f["code"] for f in findings]
        assert "CORD_COMPRESSION" in codes
        assert "UNSTABLE_FRACTURE" in codes

    def test_fracture_without_compression(self):
        """Fracture alone (no cord compression) should not trigger unstable fracture."""
        data = {"spine_lesions": [{"vertebral_fracture": True, "cord_compression": False}]}
        findings = detect_critical_findings(data)
        assert not any(f["code"] == "UNSTABLE_FRACTURE" for f in findings)
        assert not any(f["code"] == "CORD_COMPRESSION" for f in findings)


class TestThoraxFindings:
    """Toraks kritik bulgular."""

    def test_lung_malignancy_suspect(self):
        data = {"thorax_lesions": [{"spiculation": True, "lymphadenopathy": True}]}
        findings = detect_critical_findings(data)
        assert any(f["code"] == "LUNG_MALIGNANCY_SUSPECT" for f in findings)

    def test_spiculation_only(self):
        """Spiculation without LAP should not trigger."""
        data = {"thorax_lesions": [{"spiculation": True, "lymphadenopathy": False}]}
        findings = detect_critical_findings(data)
        assert not any(f["code"] == "LUNG_MALIGNANCY_SUSPECT" for f in findings)


class TestPriorityOrdering:
    """Bulgular öncelik sırasına göre sıralanmalı."""

    def test_critical_before_urgent(self):
        data = {
            "brain_lesions": [{"midline_shift": True, "mass_effect": True, "perilesional_edema": True}],
        }
        findings = detect_critical_findings(data)
        levels = [f["level"] for f in findings]
        assert levels.index("critical") < levels.index("urgent")

    def test_mixed_priority_combined(self):
        data = {"lesions": [{"tumor_in_vein": True}]}
        findings = detect_critical_findings(data, {"category": "LR-4"})
        levels = [f["level"] for f in findings]
        assert levels[0] == "critical"
        assert "significant" in levels
