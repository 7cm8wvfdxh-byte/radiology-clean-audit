# Radiology Clean Audit

Full-stack radiology audit platform with AI-powered MRI analysis, LI-RADS classification, cryptographic verification, and PDF reporting.

**Backend:** FastAPI (Python 3.12) | **Frontend:** Next.js 16 + React 19 + Tailwind CSS 4 | **AI:** Claude (Anthropic)

---

## Features

### AI Radiologist Agent
- DICOM image upload and automated MRI analysis via Claude API
- Multi-region support: liver, brain, spine, thorax, pelvis
- Real-time SSE streaming responses
- Follow-up conversation support
- Education mode with teaching notes
- Region-specific checklists (LI-RADS, BI-RADS, Lung-RADS, PI-RADS)

### LI-RADS Classification Engine
- Automated LI-RADS scoring (LR-1 through LR-5, LR-M, LR-TIV)
- Major features: arterial hyperenhancement, washout, enhancing capsule
- Ancillary features and threshold growth analysis
- Decimal lesion size support
- Surveillance recommendations (LR-3)

### Audit & Verification
- HMAC-SHA256 signed audit packs with tamper detection
- Version history (audit trail) for every case
- QR code generation for external verification
- Public `/verify` endpoint (no auth required)
- PDF export with color-coded LI-RADS badges

### Clinical Workflow
- Patient management with demographics tracking
- Lab results tracking (AFP, liver function, etc.)
- Prior case comparison (single-query optimized)
- Second reading workflow (assign, complete, agree/disagree/partial)
- Critical findings detection (lesion size, tumor in vein, DWI restriction)
- Dashboard with LI-RADS distribution stats

### Security
- JWT authentication with PBKDF2 password hashing
- Role-based access control (admin, radiologist)
- Rate limiting on auth endpoints (10/min)
- CORS with configurable allowed origins
- Typed Pydantic request validation on all endpoints

### Frontend
- Dark/light theme toggle
- Skeleton loading states
- Breadcrumb navigation
- Shared UI component library (Button, Card, FormField)
- Markdown rendering for AI reports
- DICOM image viewer
- Responsive design with Tailwind CSS 4

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI 0.115+, Python 3.12, SQLAlchemy 2.0, Pydantic 2.10 |
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| AI | Anthropic Claude API, pydicom, Pillow, NumPy |
| PDF/QR | ReportLab, qrcode |
| Auth | JWT (python-jose), PBKDF2, slowapi rate limiting |
| Database | SQLite (production-ready with WAL mode) |
| Deploy | Docker multi-stage, Vercel (frontend) |

---

## Project Structure

```
radiology-clean-audit/
├── main.py                    # FastAPI app + all routes
├── db.py                      # SQLAlchemy engine & init_db()
├── models.py                  # ORM models (Case, Patient, Lab, SecondReading, User)
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Multi-stage: backend + frontend
├── docker-compose.yml         # Backend :8000 + Frontend :3000
│
├── core/
│   ├── auth.py                # JWT, PBKDF2, role-based access
│   ├── critical_findings.py   # Critical findings detection engine
│   ├── agent/
│   │   ├── radiologist.py     # Claude AI streaming analysis
│   │   └── dicom_utils.py     # DICOM → base64 image extraction
│   └── export/
│       ├── audit_pack.py      # HMAC-SHA256 signed audit packs + LI-RADS engine
│       └── pdf_export.py      # PDF generation with QR codes
│
├── store/
│   ├── store.py               # Case CRUD + stats (optimized queries)
│   ├── patient_store.py       # Patient management + prior cases
│   ├── lab_store.py           # Lab results CRUD
│   ├── second_read_store.py   # Second reading workflow
│   └── user_store.py          # User management + default admin
│
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx           # Landing / login
│   │   ├── dashboard/         # Stats dashboard
│   │   ├── cases/             # Case list + detail view
│   │   ├── new/               # New case creation (manual)
│   │   ├── agent/             # AI radiologist agent interface
│   │   ├── patients/          # Patient list + detail
│   │   ├── compare/           # Prior case comparison
│   │   └── second-reading/    # Second reading management
│   └── src/components/
│       ├── AppHeader.tsx       # Navigation header
│       ├── Breadcrumb.tsx      # Breadcrumb navigation
│       ├── ThemeToggle.tsx     # Dark/light mode
│       ├── ImageViewer.tsx     # DICOM image viewer
│       ├── LiradsBadge.tsx     # Color-coded LI-RADS badge
│       ├── MarkdownRenderer.tsx
│       ├── Skeleton.tsx        # Loading skeleton
│       ├── agent/              # AgentPanels, LesionForms, constants
│       └── ui/                 # Button, Card, FormField
│
└── tests/
    ├── conftest.py             # Session-scoped test fixtures
    ├── test_api.py             # API endpoint tests
    ├── test_audit_pack.py      # Audit pack + signature tests
    ├── test_critical_findings.py # Critical findings tests
    └── test_lirads.py          # LI-RADS classification tests
```

---

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- Anthropic API key (for AI agent features)

### Backend

```bash
cd radiology-clean-audit

# Create virtual environment
python -m venv venv && source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY, SECRET_KEY, etc.

# Start backend
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure API base URL
echo "NEXT_PUBLIC_API_BASE=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

### Docker (Both Services)

```bash
docker compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/token` | Login (rate limited: 10/min) |
| GET | `/auth/me` | Current user info |

### Cases
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze/{case_id}` | Analyze case + generate signed audit pack |
| GET | `/cases` | List all cases |
| GET | `/cases/{case_id}` | Case detail |
| DELETE | `/cases/{case_id}` | Delete case (admin only) |
| GET | `/cases/{case_id}/versions` | Version history (audit trail) |

### AI Agent
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/agent/analyze` | AI MRI analysis (SSE stream) |
| POST | `/agent/save` | Save agent report as audit pack |
| POST | `/agent/followup` | Follow-up conversation (SSE stream) |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/export/pdf/{case_id}` | Download PDF report |
| GET | `/export/json/{case_id}` | Download JSON audit pack |

### Patients & Labs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/patients` | Create patient |
| GET | `/patients` | List patients |
| GET | `/patients/{patient_id}` | Patient detail + cases |
| GET | `/patients/{patient_id}/prior-cases` | Prior cases for comparison |
| POST | `/labs` | Add lab result |
| GET | `/labs/{patient_id}` | Patient lab results |

### Second Reading & Verification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/second-readings` | Assign second reading |
| POST | `/second-readings/{id}/complete` | Complete reading |
| GET | `/second-readings` | List readings |
| GET | `/verify/{case_id}?sig=...` | Public verification (no auth) |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard statistics |
| GET | `/checklist/{region}` | Region-specific checklist |
| POST | `/critical-findings` | Detect critical findings |

---

## Environment Variables

```env
# Required
SECRET_KEY=your-secret-key-here
ANTHROPIC_API_KEY=sk-ant-...

# Optional
DATABASE_URL=sqlite:///radiology_clean.db
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
VERIFY_BASE_URL=http://localhost:8000
ACCESS_TOKEN_EXPIRE_MINUTES=480
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

---

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test files
pytest tests/test_lirads.py -v
pytest tests/test_critical_findings.py -v
pytest tests/test_audit_pack.py -v
pytest tests/test_api.py -v
```

---

## Default Credentials

On first startup, a default admin user is created:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | admin |

> Change the default password immediately in production.

---

## License

MIT
