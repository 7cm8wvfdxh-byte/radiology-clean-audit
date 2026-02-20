from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./radiology_clean.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # sqlite için gerekli
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
