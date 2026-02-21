"""LI-RADS karar motoru testleri."""
import pytest
from core.export.audit_pack import run_lirads_decision


def _dsl(
    arterial=False,
    washout=False,
    capsule=False,
    size=0,
    cirrhosis=False,
    ancillary=None,
):
    d = {
        "arterial_phase": {"hyperenhancement": arterial},
        "portal_phase": {"washout": washout},
        "delayed_phase": {"capsule": capsule},
        "lesion_size_mm": size,
        "cirrhosis": cirrhosis,
    }
    if ancillary:
        d["ancillary_features"] = ancillary
    return d


def cat(dsl) -> str:
    """Kategoriye kısayol."""
    return run_lirads_decision(dsl)["category"]


def label(dsl) -> str:
    return run_lirads_decision(dsl)["label"]


class TestLR5:
    def test_all_criteria_met(self):
        d = _dsl(arterial=True, washout=True, capsule=True, size=22, cirrhosis=True)
        assert cat(d) == "LR-5"

    def test_exactly_10mm(self):
        d = _dsl(arterial=True, washout=True, capsule=True, size=10, cirrhosis=True)
        assert cat(d) == "LR-5"

    def test_large_lesion(self):
        d = _dsl(arterial=True, washout=True, capsule=True, size=100, cirrhosis=True)
        assert cat(d) == "LR-5"

    def test_20mm_one_major_criterion(self):
        """≥20 mm + sadece washout → LR-5"""
        d = _dsl(arterial=True, washout=True, capsule=False, size=20, cirrhosis=True)
        assert cat(d) == "LR-5"

    def test_label_format(self):
        d = _dsl(arterial=True, washout=True, capsule=True, size=15, cirrhosis=True)
        assert label(d) == "LR-5 (Definite HCC)"


class TestLR4:
    def test_washout_no_capsule(self):
        # 15mm + arteriyel + sadece washout (1 majör) + <20mm → LR-4
        d = _dsl(arterial=True, washout=True, capsule=False, size=15, cirrhosis=True)
        assert cat(d) == "LR-4"

    def test_capsule_no_washout_under_20mm(self):
        """10-19mm + arteriyel + sadece kapsül → LR-4"""
        d = _dsl(arterial=True, washout=False, capsule=True, size=15, cirrhosis=True)
        assert cat(d) == "LR-4"

    def test_exactly_10mm_ancillary(self):
        """10mm + arteriyel + ancillary → LR-4"""
        d = _dsl(
            arterial=True, washout=False, capsule=False, size=10, cirrhosis=True,
            ancillary={"fat_sparing_in_solid_mass": True}
        )
        assert cat(d) == "LR-4"


class TestLR3:
    def test_cirrhosis_arterial_no_washout_large(self):
        # Siroz + arteriyel + 15mm ama washout/kapsül/ancillary yok → LR-3
        d = _dsl(arterial=True, washout=False, capsule=False, size=15, cirrhosis=True)
        assert cat(d) == "LR-3"

    def test_arterial_small_lesion_no_cirrhosis(self):
        d = _dsl(arterial=True, washout=False, capsule=False, size=5, cirrhosis=False)
        assert cat(d) == "LR-3"

    def test_arterial_small_lesion_with_cirrhosis(self):
        d = _dsl(arterial=True, washout=False, capsule=False, size=5, cirrhosis=True)
        assert cat(d) == "LR-3"


class TestLR2:
    def test_no_arterial_no_cirrhosis(self):
        d = _dsl(arterial=False, washout=False, capsule=False, size=15, cirrhosis=False)
        assert cat(d) == "LR-2"

    def test_empty_dsl(self):
        assert cat({}) == "LR-2"

    def test_cirrhosis_only(self):
        d = _dsl(cirrhosis=True, size=30)
        assert cat(d) == "LR-2"

    def test_9mm_with_cirrhosis_and_washout_no_arterial(self):
        d = _dsl(arterial=False, washout=True, capsule=True, size=9, cirrhosis=True)
        assert cat(d) == "LR-2"


class TestAncillaryFeatures:
    def test_ancillary_favor_hcc_recorded(self):
        d = _dsl(
            arterial=True, washout=False, capsule=False, size=10, cirrhosis=True,
            ancillary={"fat_sparing_in_solid_mass": True, "corona_enhancement": True}
        )
        result = run_lirads_decision(d)
        assert "fat_sparing_in_solid_mass" in result["ancillary_favor_hcc"]
        assert "corona_enhancement" in result["ancillary_favor_hcc"]

    def test_no_ancillary_empty_list(self):
        d = _dsl(arterial=True, washout=True, capsule=True, size=22, cirrhosis=True)
        result = run_lirads_decision(d)
        assert result["ancillary_favor_hcc"] == []


class TestBoundary:
    def test_9mm_does_not_qualify_for_lr5(self):
        """9 mm LR-5 için yeterli değil."""
        d = _dsl(arterial=True, washout=True, capsule=True, size=9, cirrhosis=True)
        assert cat(d) != "LR-5"

    def test_size_zero(self):
        d = _dsl(arterial=True, washout=True, capsule=True, size=0, cirrhosis=True)
        assert cat(d) != "LR-5"

    def test_applied_criteria_recorded(self):
        d = _dsl(arterial=True, washout=True, capsule=True, size=22, cirrhosis=True)
        result = run_lirads_decision(d)
        assert "cirrhosis" in result["applied_criteria"]
        assert "arterial_hyperenhancement" in result["applied_criteria"]
        assert "washout" in result["applied_criteria"]
        assert "capsule_appearance" in result["applied_criteria"]
