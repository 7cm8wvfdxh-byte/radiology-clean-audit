import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from core.export.audit_pack import build_pack, verify_pack_full
from core.export.pdf_export import generate_pdf
from core.auth import (
    TokenResponse,
    UserInToken,
    create_access_token,
    get_current_user,
    require_role,
    verify_password,
)
from store.store import save_case, get_case, list_cases
from store.user_store import ensure_default_admin, get_user
from store.patient_store import create_patient, get_patient, list_patients, get_patient_cases


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_default_admin()
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Radiology-Clean API", version="2.0.0", lifespan=lifespan)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

VERIFY_BASE_URL = os.getenv("VERIFY_BASE_URL", "http://localhost:8000")



# ---------------------------------------------------------------------------
# Input şemaları
# ---------------------------------------------------------------------------
class ArterialPhase(BaseModel):
    hyperenhancement: bool = False

class PortalPhase(BaseModel):
    washout: bool = False

class DelayedPhase(BaseModel):
    capsule: bool = False

class AnalyzeRequest(BaseModel):
    arterial_phase: ArterialPhase = Field(default_factory=ArterialPhase)
    portal_phase: PortalPhase = Field(default_factory=PortalPhase)
    delayed_phase: DelayedPhase = Field(default_factory=DelayedPhase)
    lesion_size_mm: int = Field(ge=0, le=200, description="Lezyon boyutu (mm)")
    cirrhosis: bool = False
    patient_id: str = Field(None, description="Opsiyonel hasta ID'si")


class PatientCreate(BaseModel):
    patient_id: str = Field(..., min_length=1, description="Benzersiz hasta ID (ör: P-00001)")
    full_name: str = Field(..., min_length=2)
    birth_date: str = Field(None, description="ISO 8601: 1975-03-22")
    gender: str = Field(None, pattern="^(M|F|U)$", description="M | F | U")


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@app.post("/auth/token", response_model=TokenResponse, tags=["auth"])
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form.username)
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    token = create_access_token({"sub": user.username, "role": user.role})
    expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    return TokenResponse(access_token=token, expires_in=expire_minutes * 60)


@app.get("/auth/me", tags=["auth"])
def me(user: UserInToken = Depends(get_current_user)):
    return {"username": user.username, "role": user.role}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "version": "2.0.0"}


# ---------------------------------------------------------------------------
# Case routes (auth zorunlu)
# ---------------------------------------------------------------------------
@app.post("/analyze/{case_id}", tags=["cases"])
def analyze(
    case_id: str,
    body: AnalyzeRequest,
    user: UserInToken = Depends(require_role("admin", "radiologist")),
):
    pid = body.patient_id
    dsl = body.model_dump(exclude={"patient_id"})
    previous_pack = get_case(case_id)  # varsa önceki versiyonu al
    pack = build_pack(case_id, dsl, VERIFY_BASE_URL, previous_pack=previous_pack)
    save_case(case_id, pack, created_by=user.username, patient_id=pid)
    return pack


@app.get("/cases", tags=["cases"])
def get_cases(
    limit: int = Query(50, ge=1, le=200),
    user: UserInToken = Depends(get_current_user),
):
    return list_cases(limit=limit)


@app.get("/cases/{case_id}", tags=["cases"])
def get_case_detail(
    case_id: str,
    user: UserInToken = Depends(get_current_user),
):
    pack = get_case(case_id)
    if pack is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return pack


# ---------------------------------------------------------------------------
# Verify (auth gerektirmez — QR kodla dışarıdan erişilebilir)
# ---------------------------------------------------------------------------
@app.get("/verify/{case_id}", tags=["verify"])
def verify(case_id: str, sig: str = Query(..., description="HMAC-SHA256 imzası")):
    pack = get_case(case_id)
    if pack is None:
        raise HTTPException(status_code=404, detail="Case not found")
    result = verify_pack_full(pack)
    stored_sig = pack.get("signature", "")
    sig_match = stored_sig == sig
    return {
        "case_id": case_id,
        "sig_match": sig_match,
        **result,
    }


# ---------------------------------------------------------------------------
# Export routes (auth zorunlu)
# ---------------------------------------------------------------------------
@app.get("/export/pdf/{case_id}", tags=["export"])
def export_pdf(
    case_id: str,
    user: UserInToken = Depends(get_current_user),
):
    pack = get_case(case_id)
    if pack is None:
        raise HTTPException(status_code=404, detail="Case not found")
    path = generate_pdf(pack)
    return FileResponse(path, media_type="application/pdf", filename=f"{case_id}.pdf")


@app.get("/export/json/{case_id}", tags=["export"])
def export_json(
    case_id: str,
    user: UserInToken = Depends(get_current_user),
):
    pack = get_case(case_id)
    if pack is None:
        raise HTTPException(status_code=404, detail="Case not found")
    return JSONResponse(content=pack, headers={
        "Content-Disposition": f'attachment; filename="{case_id}.json"'
    })


# ---------------------------------------------------------------------------
# Patient routes (auth zorunlu)
# ---------------------------------------------------------------------------
@app.post("/patients", tags=["patients"])
def create_patient_endpoint(
    body: PatientCreate,
    user: UserInToken = Depends(require_role("admin", "radiologist")),
):
    try:
        return create_patient(
            patient_id=body.patient_id,
            full_name=body.full_name,
            birth_date=body.birth_date,
            gender=body.gender,
            created_by=user.username,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@app.get("/patients", tags=["patients"])
def list_patients_endpoint(
    limit: int = Query(50, ge=1, le=200),
    user: UserInToken = Depends(get_current_user),
):
    return list_patients(limit=limit)


@app.get("/patients/{patient_id}", tags=["patients"])
def get_patient_endpoint(
    patient_id: str,
    user: UserInToken = Depends(get_current_user),
):
    p = get_patient(patient_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    cases = get_patient_cases(patient_id)
    return {**p, "cases": cases}
