"""İkinci okuma (Second Reading) CRUD işlemleri."""
import datetime
from db import SessionLocal, engine, Base
from models import SecondReading

Base.metadata.create_all(bind=engine)


def create_second_reading(
    case_id: str,
    reader_username: str,
    original_category: str = None,
) -> dict:
    db = SessionLocal()
    try:
        existing = db.query(SecondReading).filter(
            SecondReading.case_id == case_id,
            SecondReading.reader_username == reader_username,
            SecondReading.status != "completed",
        ).first()
        if existing:
            raise ValueError(f"Bu vaka için zaten bekleyen ikinci okuma mevcut: {case_id}")
        sr = SecondReading(
            case_id=case_id,
            reader_username=reader_username,
            status="pending",
            original_category=original_category,
            created_at=datetime.datetime.utcnow().isoformat() + "Z",
        )
        db.add(sr)
        db.commit()
        db.refresh(sr)
        return _to_dict(sr)
    finally:
        db.close()


def complete_second_reading(
    reading_id: int,
    agreement: str,
    second_category: str = None,
    comments: str = None,
) -> dict:
    db = SessionLocal()
    try:
        sr = db.query(SecondReading).filter(SecondReading.id == reading_id).first()
        if not sr:
            raise ValueError("İkinci okuma bulunamadı")
        sr.status = "completed"
        sr.agreement = agreement
        sr.second_category = second_category
        sr.comments = comments
        sr.completed_at = datetime.datetime.utcnow().isoformat() + "Z"
        db.commit()
        db.refresh(sr)
        return _to_dict(sr)
    finally:
        db.close()


def list_second_readings(status_filter: str = None, limit: int = 50) -> list[dict]:
    db = SessionLocal()
    try:
        q = db.query(SecondReading)
        if status_filter:
            q = q.filter(SecondReading.status == status_filter)
        rows = q.order_by(SecondReading.created_at.desc()).limit(limit).all()
        return [_to_dict(r) for r in rows]
    finally:
        db.close()


def get_case_second_readings(case_id: str) -> list[dict]:
    db = SessionLocal()
    try:
        rows = db.query(SecondReading).filter(
            SecondReading.case_id == case_id
        ).order_by(SecondReading.created_at.desc()).all()
        return [_to_dict(r) for r in rows]
    finally:
        db.close()


def _to_dict(sr: SecondReading) -> dict:
    return {
        "id": sr.id,
        "case_id": sr.case_id,
        "reader_username": sr.reader_username,
        "status": sr.status,
        "agreement": sr.agreement,
        "original_category": sr.original_category,
        "second_category": sr.second_category,
        "comments": sr.comments,
        "created_at": sr.created_at,
        "completed_at": sr.completed_at,
    }
