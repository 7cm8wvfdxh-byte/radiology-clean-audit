"""Kullanıcı CRUD işlemleri."""
import logging
from db import SessionLocal, engine, Base
from models import User
from core.auth import hash_password

logger = logging.getLogger(__name__)

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
        logger.info("Kullanici olusturuldu: %s (rol: %s)", username, role)
        return user
    except Exception as exc:
        db.rollback()
        logger.error("Kullanici olusturulamadi %s: %s", username, exc)
        raise
    finally:
        db.close()


def ensure_default_admin():
    """İlk çalıştırmada admin kullanıcısı yoksa oluşturur."""
    import os
    admin_user = os.getenv("DEFAULT_ADMIN_USER", "admin")
    admin_pass = os.getenv("DEFAULT_ADMIN_PASS", "admin123")
    if admin_pass in ("admin123", "CHANGE_ME_ADMIN_PASSWORD"):
        logger.warning(
            "DEFAULT_ADMIN_PASS varsayilan veya zayif! "
            "Production ortaminda mutlaka degistirin."
        )
    if not get_user(admin_user):
        create_user(admin_user, admin_pass, role="admin", full_name="Sistem Yoneticisi")
        logger.info("Varsayilan admin kullanicisi olusturuldu: %s", admin_user)
