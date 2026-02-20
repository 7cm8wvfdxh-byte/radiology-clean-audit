# radiology-clean-audit

Minimal FastAPI backend for radiology audit + verification.

## Features

- Case analyze endpoint
- Audit-style JSON output
- Signature verification endpoint
- Designed as extracted MVP from Radiology-Clean

## Run Locally

### Install dependencies

pip install -r requirements.txt

### Start server

uvicorn app.main:app --reload --port 8000

### Open Swagger

http://127.0.0.1:8000/docs

## Purpose

Prototype for structured radiology audit + cryptographic verification flow.
