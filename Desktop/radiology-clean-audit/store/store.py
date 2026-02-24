import json
import logging
from sqlalchemy import func
from db import get_db, engine, Base
from models import Case, CaseVersion, Patient

logger = logging.getLogger(__name__)

# tabloyu oluştur
Base.metadata.create_all(bind=engine)

def save_case(case_id: str, audit_pack: dict, created_by: str = "", patient_id: str = None) -> None:
    with get_db() as db:
        pack_json = json.dumps(audit_pack, ensure_ascii=False)
        version = audit_pack.get("version", 1)
        generated_at = audit_pack.get("generated_at", "")

        rec = db.query(Case).filter(Case.case_id == case_id).first()
        if rec:
            rec.audit_pack_json = pack_json
            rec.created_at = generated_at or rec.created_at
            if patient_id:
                rec.patient_id = patient_id
            logger.info("Vaka guncellendi: %s (v%s, kullanici: %s)", case_id, version, created_by)
        else:
            rec = Case(
                case_id=case_id,
                created_at=generated_at,
                created_by=created_by,
                patient_id=patient_id,
                audit_pack_json=pack_json,
            )
            db.add(rec)
            logger.info("Yeni vaka olusturuldu: %s (kullanici: %s)", case_id, created_by)

        # Versiyon geçmişine ekle
        ver = CaseVersion(
            case_id=case_id,
            version=version,
            created_at=generated_at,
            created_by=created_by,
            audit_pack_json=pack_json,
        )
        db.add(ver)
        db.commit()

def get_case(case_id: str):
    with get_db() as db:
        rec = db.query(Case).filter(Case.case_id == case_id).first()
        if not rec:
            return None
        return json.loads(rec.audit_pack_json)

def delete_case(case_id: str) -> bool:
    """Bir vakayı ve tüm versiyon geçmişini siler."""
    with get_db() as db:
        rec = db.query(Case).filter(Case.case_id == case_id).first()
        if not rec:
            return False
        db.query(CaseVersion).filter(CaseVersion.case_id == case_id).delete()
        db.delete(rec)
        db.commit()
        logger.info("Vaka silindi: %s", case_id)
        return True

def list_cases(limit: int = 50):
    with get_db() as db:
        rows = db.query(Case).order_by(Case.created_at.desc()).limit(limit).all()
        result = []
        for r in rows:
            item = {
                "case_id": r.case_id,
                "created_at": r.created_at,
                "created_by": r.created_by,
                "patient_id": r.patient_id,
            }
            try:
                pack = json.loads(r.audit_pack_json)
                item["decision"] = (pack.get("content") or {}).get("decision")
                item["category"] = ((pack.get("content") or {}).get("lirads") or {}).get("category")
            except (json.JSONDecodeError, TypeError):
                pass
            result.append(item)
        return result


def get_case_versions(case_id: str) -> list[dict]:
    """Bir vakanın tüm versiyon geçmişini döner (yeniden eskiye)."""
    with get_db() as db:
        rows = db.query(CaseVersion).filter(
            CaseVersion.case_id == case_id
        ).order_by(CaseVersion.version.desc()).all()
        result = []
        for r in rows:
            try:
                pack = json.loads(r.audit_pack_json)
            except (json.JSONDecodeError, TypeError):
                pack = {}
            content = pack.get("content") or {}
            lirads = content.get("lirads") or {}
            result.append({
                "version": r.version,
                "created_at": r.created_at,
                "created_by": r.created_by,
                "category": lirads.get("category", "unknown"),
                "decision": content.get("decision", "-"),
                "previous_hash": pack.get("previous_hash"),
                "signature": pack.get("signature", "")[:16],
            })
        return result


def get_case_stats() -> dict:
    """Tüm vakaların LI-RADS dağılımı ve istatistiklerini döner."""
    with get_db() as db:
        total = db.query(func.count(Case.case_id)).scalar()
        patient_count = db.query(func.count(Patient.patient_id)).scalar()

        # Sadece son 200 kaydi isle (buyuk veri setlerinde bellek tasarrufu)
        rows = db.query(Case).order_by(Case.created_at.desc()).limit(200).all()

        lirads_dist: dict[str, int] = {}
        recent = []
        high_risk = []

        for r in rows:
            try:
                pack = json.loads(r.audit_pack_json)
            except (json.JSONDecodeError, TypeError):
                continue

            content = pack.get("content") or {}
            lirads = content.get("lirads") or {}
            category = lirads.get("category", "unknown")
            decision = content.get("decision", "-")

            lirads_dist[category] = lirads_dist.get(category, 0) + 1

            item = {
                "case_id": r.case_id,
                "created_at": r.created_at,
                "created_by": r.created_by,
                "patient_id": r.patient_id,
                "category": category,
                "decision": decision,
            }
            recent.append(item)

            if category in ("LR-4", "LR-5", "LR-M", "LR-TIV"):
                high_risk.append(item)

        return {
            "total_cases": total,
            "total_patients": patient_count,
            "lirads_distribution": lirads_dist,
            "recent_cases": recent[:10],
            "high_risk_cases": high_risk[:10],
        }
