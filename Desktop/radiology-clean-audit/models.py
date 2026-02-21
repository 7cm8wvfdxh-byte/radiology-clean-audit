from sqlalchemy import Column, String, Text, ForeignKey
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


class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")  # admin | radiologist | viewer
    full_name = Column(String, nullable=True)
