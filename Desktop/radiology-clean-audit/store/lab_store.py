"""Laboratuvar sonuçları CRUD işlemleri."""
import datetime
from db import SessionLocal, engine, Base
from models import LabResult

Base.metadata.create_all(bind=engine)


def create_lab_result(
    patient_id: str,
    test_name: str,
    value: str,
    unit: str = None,
    reference_range: str = None,
    is_abnormal: str = "normal",
    test_date: str = None,
    created_by: str = "",
) -> dict:
    db = SessionLocal()
    try:
        lr = LabResult(
            patient_id=patient_id,
            test_name=test_name,
            value=value,
            unit=unit,
            reference_range=reference_range,
            is_abnormal=is_abnormal,
            test_date=test_date or datetime.datetime.utcnow().strftime("%Y-%m-%d"),
            created_at=datetime.datetime.utcnow().isoformat() + "Z",
            created_by=created_by,
        )
        db.add(lr)
        db.commit()
        db.refresh(lr)
        return _to_dict(lr)
    finally:
        db.close()


def get_patient_labs(patient_id: str, limit: int = 50) -> list[dict]:
    db = SessionLocal()
    try:
        rows = db.query(LabResult).filter(
            LabResult.patient_id == patient_id
        ).order_by(LabResult.test_date.desc()).limit(limit).all()
        return [_to_dict(r) for r in rows]
    finally:
        db.close()


def delete_lab_result(lab_id: int) -> bool:
    db = SessionLocal()
    try:
        lr = db.query(LabResult).filter(LabResult.id == lab_id).first()
        if not lr:
            return False
        db.delete(lr)
        db.commit()
        return True
    finally:
        db.close()


def _to_dict(lr: LabResult) -> dict:
    return {
        "id": lr.id,
        "patient_id": lr.patient_id,
        "test_name": lr.test_name,
        "value": lr.value,
        "unit": lr.unit,
        "reference_range": lr.reference_range,
        "is_abnormal": lr.is_abnormal,
        "test_date": lr.test_date,
        "created_at": lr.created_at,
        "created_by": lr.created_by,
    }
