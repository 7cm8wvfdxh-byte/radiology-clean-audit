"""Kullanıcı CRUD işlemleri."""
import logging
from db import get_db
from models import User
from core.auth import hash_password

logger = logging.getLogger(__name__)


def get_user(username: str):
    with get_db() as db:
        return db.query(User).filter(User.username == username).first()


def create_user(username: str, plain_password: str, role: str = "viewer", full_name: str = "") -> User:
    with get_db() as db:
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


def ensure_default_admin():
    """İlk çalıştırmada admin kullanıcısı yoksa oluşturur."""
    import os
    admin_user = os.getenv("DEFAULT_ADMIN_USER", "admin")
    admin_pass = os.getenv("DEFAULT_ADMIN_PASS", "admin123")
    weak_passwords = ("admin123", "CHANGE_ME_ADMIN_PASSWORD", "password", "123456")
    if admin_pass in weak_passwords or len(admin_pass) < 8:
        logger.warning(
            "DEFAULT_ADMIN_PASS varsayilan veya zayif! "
            "Production ortaminda mutlaka degistirin (en az 12 karakter onerilir)."
        )
    if not get_user(admin_user):
        create_user(admin_user, admin_pass, role="admin", full_name="Sistem Yoneticisi")
        logger.info("Varsayilan admin kullanicisi olusturuldu: %s", admin_user)
