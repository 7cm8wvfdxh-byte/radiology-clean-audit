"""Hasta CRUD işlemleri."""
import datetime
import logging
from db import get_db, engine, Base
from models import Patient, Case

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)


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
            created_at=datetime.datetime.utcnow().isoformat() + "Z",
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


def get_patient_cases(patient_id: str) -> list[str]:
    with get_db() as db:
        rows = db.query(Case).filter(Case.patient_id == patient_id).all()
        return [r.case_id for r in rows]


def _patient_to_dict(p: Patient) -> dict:
    return {
        "patient_id": p.patient_id,
        "full_name": p.full_name,
        "birth_date": p.birth_date,
        "gender": p.gender,
        "created_at": p.created_at,
        "created_by": p.created_by,
    }
