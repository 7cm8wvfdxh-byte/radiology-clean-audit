import json
from db import SessionLocal, engine, Base
from models import Case

# tabloyu oluştur
Base.metadata.create_all(bind=engine)

def save_case(case_id: str, audit_pack: dict, created_by: str = "", patient_id: str = None) -> None:
    db = SessionLocal()
    try:
        rec = db.query(Case).filter(Case.case_id == case_id).first()
        if rec:
            rec.audit_pack_json = json.dumps(audit_pack, ensure_ascii=False)
            rec.created_at = audit_pack.get("generated_at", rec.created_at)
            if patient_id:
                rec.patient_id = patient_id
        else:
            rec = Case(
                case_id=case_id,
                created_at=audit_pack.get("generated_at", ""),
                created_by=created_by,
                patient_id=patient_id,
                audit_pack_json=json.dumps(audit_pack, ensure_ascii=False),
            )
            db.add(rec)
        db.commit()
    finally:
        db.close()

def get_case(case_id: str):
    db = SessionLocal()
    try:
        rec = db.query(Case).filter(Case.case_id == case_id).first()
        if not rec:
            return None
        return json.loads(rec.audit_pack_json)
    finally:
        db.close()

def list_cases(limit: int = 50):
    db = SessionLocal()
    try:
        rows = db.query(Case).order_by(Case.created_at.desc()).limit(limit).all()
        return [{"case_id": r.case_id, "created_at": r.created_at, "created_by": r.created_by, "patient_id": r.patient_id} for r in rows]
    finally:
        db.close()
