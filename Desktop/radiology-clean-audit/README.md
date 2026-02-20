\# radiology-clean-audit



Minimal FastAPI backend for radiology audit + verification.



\## What this does



\- Accepts case\_id

\- Generates signed audit payload

\- Returns decision + confidence

\- Provides verification endpoint



This repo is an MVP backend extracted from Radiology-Clean.



\## Run locally



```bash

pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000

