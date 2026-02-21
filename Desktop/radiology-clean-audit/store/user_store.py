"""Kullanıcı CRUD işlemleri."""
from db import SessionLocal, engine, Base
from models import User
from core.auth import hash_password

Base.metadata.create_all(bind=engine)


def get_user(username: str):
    db = SessionLocal()
    try:
        return db.query(User).filter(User.username == username).first()
    finally:
        db.close()


def create_user(username: str, plain_password: str, role: str = "viewer", full_name: str = "") -> User:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            raise ValueError(f"Kullanıcı zaten mevcut: {username}")
        user = User(
            username=username,
            hashed_password=hash_password(plain_password),
            role=role,
            full_name=full_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def ensure_default_admin():
    """İlk çalıştırmada admin kullanıcısı yoksa oluşturur."""
    import os
    admin_user = os.getenv("DEFAULT_ADMIN_USER", "admin")
    admin_pass = os.getenv("DEFAULT_ADMIN_PASS", "admin123")
    if not get_user(admin_user):
        create_user(admin_user, admin_pass, role="admin", full_name="Sistem Yöneticisi")
