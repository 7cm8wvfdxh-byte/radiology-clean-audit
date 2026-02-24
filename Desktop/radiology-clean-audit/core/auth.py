"""JWT tabanlı kullanıcı kimlik doğrulama (standart kütüphane ile HS256)."""
import base64
import hashlib
import hmac
import json
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class JWTError(Exception):
    pass


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def _jwt_sign(secret: str, message: str) -> str:
    return _b64url_encode(
        hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
    )


def _jwt_encode(payload: dict, secret: str) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    body = _b64url_encode(json.dumps(payload, separators=(",", ":"), default=str).encode())
    sig = _jwt_sign(secret, f"{header}.{body}")
    return f"{header}.{body}.{sig}"


def _jwt_decode(token: str, secret: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise JWTError("Invalid token structure")
        header_b64, body_b64, sig_b64 = parts
        expected_sig = _jwt_sign(secret, f"{header_b64}.{body_b64}")
        if not hmac.compare_digest(sig_b64, expected_sig):
            raise JWTError("Signature mismatch")
        payload = json.loads(_b64url_decode(body_b64))
        exp = payload.get("exp")
        if exp:
            exp_dt = datetime.fromtimestamp(float(exp), tz=timezone.utc)
            if datetime.now(timezone.utc) > exp_dt:
                raise JWTError("Token expired")
        return payload
    except JWTError:
        raise
    except Exception as e:
        raise JWTError(str(e)) from e

_jwt_secret_raw = os.getenv("JWT_SECRET", "")
if not _jwt_secret_raw or _jwt_secret_raw in ("CHANGE_ME_JWT_SECRET", "CHANGE_ME_STRONG_JWT_SECRET_HERE"):
    logger.warning(
        "JWT_SECRET ortam değişkeni tanımlı değil veya varsayılan bırakılmış! "
        "Production ortamında güçlü bir secret kullanın."
    )
    _jwt_secret_raw = _jwt_secret_raw or "DEV_ONLY_FALLBACK_SECRET"

SECRET_KEY = _jwt_secret_raw
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# --- Şifre hashleme (PBKDF2-HMAC-SHA256, standart kütüphane) ---
_HASH_ITERS = 260_000
_HASH_ALG = "sha256"


# ---------------------------------------------------------------------------
# Şemalar
# ---------------------------------------------------------------------------
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInToken(BaseModel):
    username: str
    role: str  # "admin" | "radiologist" | "viewer"


# ---------------------------------------------------------------------------
# Yardımcı fonksiyonlar
# ---------------------------------------------------------------------------
def hash_password(plain: str) -> str:
    """PBKDF2-HMAC-SHA256 ile şifreler. Format: pbkdf2$iters$salt$hash"""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(_HASH_ALG, plain.encode(), salt.encode(), _HASH_ITERS)
    return f"pbkdf2${_HASH_ITERS}${salt}${dk.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    try:
        _, iters_str, salt, stored_hex = hashed.split("$")
        iters = int(iters_str)
        dk = hashlib.pbkdf2_hmac(_HASH_ALG, plain.encode(), salt.encode(), iters)
        return hmac.compare_digest(dk.hex(), stored_hex)
    except Exception as exc:
        logger.error("Şifre doğrulama hatası: %s", exc)
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload["exp"] = expire.timestamp()
    return _jwt_encode(payload, SECRET_KEY)


def decode_token(token: str) -> UserInToken:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz veya süresi dolmuş token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = _jwt_decode(token, SECRET_KEY)
        username: str = payload.get("sub")
        role: str = payload.get("role", "viewer")
        if not username:
            raise credentials_exc
        return UserInToken(username=username, role=role)
    except JWTError:
        raise credentials_exc


def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInToken:
    return decode_token(token)


def require_role(*roles: str):
    """Belirtilen rollerden birine sahip kullanıcı gerektirir."""
    def checker(user: UserInToken = Depends(get_current_user)) -> UserInToken:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bu işlem için yetki gerekiyor: {', '.join(roles)}",
            )
        return user
    return checker
