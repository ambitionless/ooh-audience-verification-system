# OOH Audience Verification SaaS

Enterprise-grade Out-of-Home (OOH) advertising audience measurement and verification platform. 

## Features
- AI-Powered Computer Vision (YOLOv8 + ByteTrack).
- ROI-based dwell time and exposure calculation.
- PostgreSQL-backed persistent job results.
- Real-time processing status tracking.
- Enterprise SaaS dashboard (Next.js).

## Local Development
1. **Backend**:
   - Python 3.13 (use venv).
   - PostgreSQL 16 (ensure database `ooh_audience_db` is created).
   - `pip install -r requirements.txt`
   - `.env` file: `DATABASE_URL=postgresql+psycopg2://localhost/ooh_audience_db`
   - Run: `.venv/bin/uvicorn backend.main:app --reload`
2. **Frontend**:
   - `cd frontend`
   - `npm install`
   - Run: `npm run dev`

## Methodology
Exposure = Person enters configured ROI zone + remains for dwell threshold (default 2s). No PII stored.
