from sqlalchemy import Column, String, Text
from db import Base

class Case(Base):
    __tablename__ = "cases"

    case_id = Column(String, primary_key=True, index=True)
    created_at = Column(String, nullable=False)

    # audit pack JSON'u text olarak saklıyoruz (sonra json column'a geçebilir)
    audit_pack_json = Column(Text, nullable=False)
