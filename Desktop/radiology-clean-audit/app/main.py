from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import hashlib
from reportlab.pdfgen import canvas

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# basit in-memory case storage
DB = {}

@app.get("/")
def root():
    return {"status": "ok"}


# ----------------------------
# ANALYZE (dinamik case_id)
# ----------------------------
@app.post("/analyze/{case_id}")
def analyze(case_id: str):

    payload = {
        "schema": "radiology-clean.audit-pack.v1",
        "case_id": case_id,
        "decision": "LR-5 (Definite HCC)",
        "confidence": 0.92
    }

    sig = hashlib.sha256(str(payload).encode()).hexdigest()

    payload["signature"] = sig
    payload["verify_url"] = f"http://127.0.0.1:8000/verify/{case_id}?sig={sig}"

    DB[case_id] = payload

    return payload


# ----------------------------
# GET CASE
# ----------------------------
@app.get("/cases/{case_id}")
def get_case(case_id: str):

    if case_id not in DB:
        return JSONResponse({"error": "NOT_FOUND"}, status_code=404)

    return DB[case_id]


# ----------------------------
# VERIFY
# ----------------------------
@app.get("/verify/{case_id}")
def verify(case_id: str, sig: str = Query(...)):

    if case_id not in DB:
        return {"valid": False}

    real = hashlib.sha256(str({
        "schema": DB[case_id]["schema"],
        "case_id": DB[case_id]["case_id"],
        "decision": DB[case_id]["decision"],
        "confidence": DB[case_id]["confidence"]
    }).encode()).hexdigest()

    return {"valid": real == sig}


# ----------------------------
# PDF EXPORT
# ----------------------------
@app.get("/export/pdf/{case_id}")
def export_pdf(case_id: str):

    if case_id not in DB:
        return JSONResponse({"error": "NOT_FOUND"}, status_code=404)

    filename = f"{case_id}.pdf"
    c = canvas.Canvas(filename)

    y = 800
    for k, v in DB[case_id].items():
        c.drawString(40, y, f"{k}: {v}")
        y -= 20

    c.save()

    return FileResponse(filename, filename=filename)