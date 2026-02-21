"""Hasta CRUD işlemleri."""
import datetime
from db import SessionLocal, engine, Base
from models import Patient, Case

Base.metadata.create_all(bind=engine)


def create_patient(
    patient_id: str,
    full_name: str,
    birth_date: str = None,
    gender: str = None,
    created_by: str = "",
) -> dict:
    db = SessionLocal()
    try:
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
        return _patient_to_dict(p)
    finally:
        db.close()


def get_patient(patient_id: str) -> dict | None:
    db = SessionLocal()
    try:
        p = db.query(Patient).filter(Patient.patient_id == patient_id).first()
        return _patient_to_dict(p) if p else None
    finally:
        db.close()


def list_patients(limit: int = 50) -> list[dict]:
    db = SessionLocal()
    try:
        rows = db.query(Patient).order_by(Patient.created_at.desc()).limit(limit).all()
        return [_patient_to_dict(r) for r in rows]
    finally:
        db.close()


def get_patient_cases(patient_id: str) -> list[str]:
    db = SessionLocal()
    try:
        rows = db.query(Case).filter(Case.patient_id == patient_id).all()
        return [r.case_id for r in rows]
    finally:
        db.close()


def _patient_to_dict(p: Patient) -> dict:
    return {
        "patient_id": p.patient_id,
        "full_name": p.full_name,
        "birth_date": p.birth_date,
        "gender": p.gender,
        "created_at": p.created_at,
        "created_by": p.created_by,
    }
