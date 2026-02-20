from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
from fastapi.responses import JSONResponse, FileResponse
import hashlib
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime

app = FastAPI()
DB = {}

@app.api_route("/analyze/{case_id}", methods=["GET", "POST"])
def analyze(case_id: str):
    content = {
        "arterial_phase": {"hyperenhancement": True},
        "portal_phase": {"washout": True},
        "delayed_phase": {"capsule": True},
        "lesion_size_mm": 22,
        "cirrhosis": True
    }

    decision = "LR-5 (Definite HCC)"

    payload = {
        "schema": "radiology-clean.audit-pack.v2",
        "generated_at": datetime.utcnow().isoformat(),
        "case_id": case_id,
        "content": content,
        "decision": decision
    }

    sig = hashlib.sha256(str(payload).encode()).hexdigest()
    payload["signature"] = sig
    payload["verify_url"] = f"http://127.0.0.1:8000/verify/{case_id}?sig={sig}"

    DB[case_id] = payload
    return payload


@app.get("/cases")
def list_cases():
    return list(DB.keys())


@app.get("/cases/{case_id}")
def get_case(case_id: str):
    if case_id not in DB:
        return JSONResponse({"error": "NOT_FOUND"}, status_code=404)
    return DB[case_id]


@app.get("/verify/{case_id}")
def verify(case_id: str, sig: str = Query(...)):
    if case_id not in DB:
        return {"valid": False}

    real = hashlib.sha256(str(DB[case_id]).encode()).hexdigest()
    return {"valid": real == sig}


@app.get("/export/pdf/{case_id}")
def export_pdf(case_id: str):
    if case_id not in DB:
        return JSONResponse({"error": "NOT_FOUND"}, status_code=404)

    filename = f"{case_id}.pdf"
    c = canvas.Canvas(filename, pagesize=A4)

    y = 800
    for k, v in DB[case_id].items():
        c.drawString(40, y, f"{k}: {v}")
        y -= 20

    c.save()
    return FileResponse(filename)