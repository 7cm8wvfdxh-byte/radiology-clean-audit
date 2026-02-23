from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from db import Base


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(String, primary_key=True, index=True)  # ör: "P-00001"
    full_name = Column(String, nullable=False)
    birth_date = Column(String, nullable=True)   # ISO 8601: "1975-03-22"
    gender = Column(String, nullable=True)        # "M" | "F" | "U"
    created_at = Column(String, nullable=False)
    created_by = Column(String, nullable=True)

    cases = relationship("Case", back_populates="patient")


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(String, primary_key=True, index=True)
    created_at = Column(String, nullable=False)
    created_by = Column(String, nullable=True)

    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=True, index=True)
    patient = relationship("Patient", back_populates="cases")

    # audit pack JSON'u text olarak saklıyoruz
    audit_pack_json = Column(Text, nullable=False)


class CaseVersion(Base):
    """Her vaka güncellemesinin geçmişini tutar (audit trail)."""
    __tablename__ = "case_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.case_id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    created_at = Column(String, nullable=False)
    created_by = Column(String, nullable=True)
    audit_pack_json = Column(Text, nullable=False)

    case = relationship("Case", back_populates="versions")


# Case tablosuna versions ilişkisi ekle
Case.versions = relationship("CaseVersion", back_populates="case", order_by=CaseVersion.version.desc())


class LabResult(Base):
    """Hastaya ait laboratuvar sonuçları."""
    __tablename__ = "lab_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.patient_id"), nullable=False, index=True)
    test_name = Column(String, nullable=False)    # AFP, ALT, AST, Bilirubin, etc.
    value = Column(String, nullable=False)
    unit = Column(String, nullable=True)
    reference_range = Column(String, nullable=True)
    is_abnormal = Column(String, nullable=True)   # "high" | "low" | "normal"
    test_date = Column(String, nullable=False)     # ISO 8601
    created_at = Column(String, nullable=False)
    created_by = Column(String, nullable=True)

    patient = relationship("Patient")


class SecondReading(Base):
    """İkinci okuma (kalite güvence) kaydı."""
    __tablename__ = "second_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(String, ForeignKey("cases.case_id"), nullable=False, index=True)
    reader_username = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending | in_progress | completed
    agreement = Column(String, nullable=True)  # agree | disagree | partial
    original_category = Column(String, nullable=True)
    second_category = Column(String, nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)
    completed_at = Column(String, nullable=True)

    case = relationship("Case")


class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")  # admin | radiologist | viewer
    full_name = Column(String, nullable=True)
