"""Hasta CRUD işlemleri."""
import json
import datetime
import logging
from datetime import timezone
from db import get_db
from models import Patient, Case

logger = logging.getLogger(__name__)


def create_patient(
    patient_id: str,
    full_name: str,
    birth_date: str = None,
    gender: str = None,
    created_by: str = "",
) -> dict:
    with get_db() as db:
        existing = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        if existing:
            raise ValueError(f"Hasta zaten mevcut: {patient_id}")
        p = Patient(
            patient_id=patient_id,
            full_name=full_name,
            birth_date=birth_date,
            gender=gender,
            created_at=datetime.datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            created_by=created_by,
        )
        db.add(p)
        db.commit()
        db.refresh(p)
        logger.info("Hasta olusturuldu: %s (kullanici: %s)", patient_id, created_by)
        return _patient_to_dict(p)


def get_patient(patient_id: str) -> dict | None:
    with get_db() as db:
        p = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        return _patient_to_dict(p) if p else None


def list_patients(limit: int = 50) -> list[dict]:
    with get_db() as db:
        rows = db.query(Patient).order_by(Patient.created_at.desc()).limit(limit).all()
        return [_patient_to_dict(r) for r in rows]


def get_patient_cases(patient_id: str) -> list[dict]:
    """Hasta vakalarını özet bilgilerle döner."""
    with get_db() as db:
        rows = db.query(Case).filter(
            Case.patient_id == patient_id
        ).order_by(Case.created_at.desc()).all()
        result = []
        for r in rows:
            item: dict = {"case_id": r.case_id, "created_at": r.created_at}
            try:
                pack = json.loads(r.audit_pack_json)
                item["decision"] = (pack.get("content") or {}).get("decision")
                item["category"] = ((pack.get("content") or {}).get("lirads") or {}).get("category")
            except (json.JSONDecodeError, TypeError):
                pass
            result.append(item)
        return result


def get_patient_cases_full(patient_id: str) -> list[dict]:
    """Hasta vakalarının tam içeriğini döner (prior-cases karşılaştırma için, tek sorgu)."""
    with get_db() as db:
        rows = db.query(Case).filter(
            Case.patient_id == patient_id
        ).order_by(Case.created_at.desc()).all()
        results = []
        for r in rows:
            try:
                pack = json.loads(r.audit_pack_json)
            except (json.JSONDecodeError, TypeError):
                continue
            results.append({
                "case_id": r.case_id,
                "generated_at": pack.get("generated_at"),
                "version": pack.get("version"),
                "content": pack.get("content"),
            })
        return results


def _patient_to_dict(p: Patient) -> dict:
    return {
        "patient_id": p.patient_id,
        "full_name": p.full_name,
        "birth_date": p.birth_date,
        "gender": p.gender,
        "created_at": p.created_at,
        "created_by": p.created_by,
    }
