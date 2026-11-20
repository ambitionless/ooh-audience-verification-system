OOH Audience Verification SaaS
AI-powered audience measurement and verification for Out-of-Home (OOH) advertising.

Faculty-Guided B.Tech Minor Project · Product Lead + Student Researcher




Overview
OOH Audience Verification SaaS is a computer-vision product that turns OOH video footage into structured audience and potential-exposure insights.

The system combines YOLOv8, ByteTrack, ROI analysis, dwell-time measurement, PostgreSQL, FastAPI, and a Next.js SaaS interface to move from raw video → measurable signals → analytics.

The project was proposed by me and is being developed under faculty guidance, with responsibility spanning product definition and engineering implementation.
🎯 Problem
OOH campaigns can measure traffic around an advertising location, but granular audience exposure is harder to verify.

This product explores how to answer:
- How many people entered the relevant advertising zone?
- How long did they remain there?
- Which observations qualify as potential exposure?
- How can these observations become useful campaign analytics?
Product goal:
Video → Detection → Tracking → ROI → Dwell → Exposure → Analytics
⚡ Key Features
- Person Detection — YOLOv8
- Multi-Object Tracking — ByteTrack
- ROI-Based Analysis — configurable advertising/viewing zone
- Dwell-Time Measurement — tracks time spent inside the ROI
- Exposure Qualification — detection + tracking + ROI + dwell threshold
- Persistent Results — PostgreSQL-backed processing records
- Processing Status — job-oriented workflow
- SaaS Dashboard — Next.js / React / TypeScript
- API Layer — FastAPI
Exposure Methodology
Person enters configured ROI
            +
Remains for minimum dwell threshold
            ↓
      Potential Exposure
Default dwell threshold: 2 seconds.
Exposure is a computer-vision-based potential exposure signal, not a direct measurement of human attention or gaze.

🧠 Product + Engineering
This project is being built as a 0→1 AI product, not only as an ML model.

Product: problem definition · target users · MVP · product requirements · workflow · analytics

AI/CV: YOLOv8 · ByteTrack · ROI · dwell time · exposure logic

Engineering: FastAPI · PostgreSQL · Next.js · REST APIs · job-oriented processing
Architecture
              Next.js / SaaS UI
                     │
                  REST API
                     ▼
                 FastAPI
                     │
                     ▼
                PostgreSQL
                     │
              Processing Jobs
                     │
                     ▼
        ┌────────────────────────┐
        │       CV Worker        │
        │ YOLOv8 + ByteTrack     │
        │ ROI + Dwell + Exposure │
        └────────────┬───────────┘
                     │
                     ▼
              Results / Analytics
📊 Product Metrics
Audience: tracked persons · exposure events · exposure rate · average dwell time

System: processing time · completion rate · throughput

CV evaluation: precision / recall · tracking consistency · ID switches · FPS

These define the current product and evaluation framework; commercial-scale measurement accuracy has not yet been validated.
👥 Target Users
Primary: OOH advertisers · media agencies · campaign managers

Secondary: media owners/operators · analytics & reporting teams
🛠️ Tech Stack
Area	Stack
Computer Vision	Python, OpenCV, YOLOv8, ByteTrack
Backend	FastAPI, Python
Database	PostgreSQL, Alembic
Frontend	Next.js, React, TypeScript
Architecture	REST API, job-oriented processing
Development	Git, GitHub


👨‍💻 My Role
Product Lead + Student Researcher

I proposed the project idea and am developing it under faculty guidance.

My work spans:
- Product problem & user definition
- MVP and product requirements
- Exposure methodology
- Computer-vision pipeline
- Backend/API & database
- Product workflow and dashboard
- Testing and iterative development
🚧 Status
Module	Status
YOLOv8 Detection	✅
ByteTrack Tracking	✅
ROI + Exposure Logic	✅
Streamlit Prototype	✅
Backend Foundation	🚧
Processing Jobs	🚧
Next.js Application	🚧
Analytics & Reporting	🚧
End-to-End Integration	🚧


Active development
⚙️ Local Setup
Backend
Requirements: Python 3.13 · PostgreSQL 16
pip install -r requirements.txt
Create .env:
DATABASE_URL=postgresql+psycopg2://localhost/ooh_audience_db
Run:
.venv/bin/uvicorn backend.main:app --reload
Frontend
cd frontend
npm install
npm run dev
⚠️ Limitations
This is an academic/prototype system. Results can be affected by camera positioning, occlusion, lighting, video quality, and detection/tracking errors.

Exposure represents a potential exposure signal, not guaranteed advertising impressions.
🔮 Roadmap
- Asynchronous video processing
- Campaign-level analytics
- Historical/site-level comparisons
- Automated verification reports
- Multi-location campaign management
- Scalable deployment
- Improved CV evaluation
👤 Author
Hemant Kumar
B.Tech — Artificial Intelligence & Machine Learning · GGSIPU

Product Lead + Student Researcher
Built at the intersection of AI, Computer Vision, Product Management, and SaaS.
