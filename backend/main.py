import os
import shutil
import json
from datetime import datetime, timedelta
from typing import Optional, List

import bcrypt
import jwt
import requests
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.database import engine, Base, get_db, SessionLocal
from backend.models import Organization, User, Site, Video, ProcessingJob, ExposureEvent
from app.detector import PersonDetector

# JWT Config
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "ooh-audience-verification-super-secret-key-production-2026-xyz")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

app = FastAPI(
    title="OOH Audience Verification API",
    description="Real-world OOH video verification SaaS powered by YOLOv8, ByteTrack, ROI, and Exposure Engine.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "data/videos"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Static file mounting
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")
if os.path.exists(UPLOAD_DIR):
    app.mount("/data/videos", StaticFiles(directory=UPLOAD_DIR), name="data_videos")

security = HTTPBearer(auto_error=False)


# -------------------------------------------------------------
# Password & JWT Helpers
# -------------------------------------------------------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: int, email: str, org_id: Optional[int]) -> str:
    expires = datetime.utcnow() + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "org_id": org_id,
        "exp": expires
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except Exception:
        return None

def require_current_user(user: Optional[User] = Depends(get_current_user)) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )
    return user


# -------------------------------------------------------------
# Seed Default Workspace & Analyst User on Startup
# -------------------------------------------------------------
@app.on_event("startup")
def startup_seed_data():
    db = SessionLocal()
    try:
        # Ensure default organization exists
        org = db.query(Organization).first()
        if not org:
            org = Organization(name="OmniMedia Global")
            db.add(org)
            db.commit()
            db.refresh(org)

        # Ensure default site exists
        site = db.query(Site).first()
        if not site:
            site = Site(
                name="Piccadilly Lights London",
                location="Piccadilly Circus, London, UK",
                organization_id=org.id
            )
            db.add(site)
            db.commit()
            db.refresh(site)

        # Ensure default user exists
        user = db.query(User).filter(User.email == "analyst@oohverify.com").first()
        if not user:
            user = User(
                email="analyst@oohverify.com",
                hashed_password=hash_password("password123"),
                organization_id=org.id
            )
            db.add(user)
            db.commit()

        # Check existing job 1 dwell_threshold / roi
        job1 = db.query(ProcessingJob).filter(ProcessingJob.id == 1).first()
        if job1:
            updated = False
            if job1.dwell_threshold is None:
                job1.dwell_threshold = 2.0
                updated = True
            if not job1.roi_config:
                job1.roi_config = json.dumps({
                    "points": [[0.3, 0.3], [0.7, 0.3], [0.7, 0.7], [0.3, 0.7]],
                    "campaign_name": "Autumn Audience Verification Demo"
                })
                updated = True
            if updated:
                db.commit()
    except Exception as e:
        db.rollback()
        print(f"Startup seed notice: {e}")
    finally:
        db.close()


# -------------------------------------------------------------
# CV Background Worker
# -------------------------------------------------------------
def run_processing_pipeline(job_id: int, video_path: str, output_path: str, roi_points: list = None, dwell_threshold: float = 2.0):
    db = SessionLocal()
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        db.close()
        return

    try:
        job.status = "processing"
        db.commit()

        detector = PersonDetector(model_name="yolov8n.pt", conf_thresh=0.25)
        stats = detector.process_video(
            input_path=video_path,
            output_path=output_path,
            roi_points=roi_points,
            dwell_threshold=dwell_threshold
        )

        job.total_frames = stats["total_frames"]
        job.total_tracked_ids = stats["total_tracked_ids"]
        job.total_exposures = stats["total_exposures"]
        job.output_video_path = stats["output_path"]
        job.status = "completed"
        job.completed_at = datetime.utcnow()

        if "exposure_events" in stats and stats["exposure_events"]:
            for event_data in stats["exposure_events"]:
                event = ExposureEvent(
                    job_id=job.id,
                    tracking_id=event_data["tracking_id"],
                    entry_time=event_data["entry_time"],
                    dwell_seconds=event_data["dwell_seconds"],
                    exposure=event_data["exposure"]
                )
                db.add(event)
        db.commit()
    except Exception as e:
        job.status = "failed"
        job.error_message = str(e)
        db.commit()
    finally:
        db.close()


# -------------------------------------------------------------
# Schemas
# -------------------------------------------------------------
class SignupRequest(BaseModel):
    email: str
    password: str
    organization_name: Optional[str] = "OmniMedia Global"

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str

class SiteCreate(BaseModel):
    name: str
    location: str
    organization_id: Optional[int] = None

class OrganizationCreate(BaseModel):
    name: str


# -------------------------------------------------------------
# System & Health
# -------------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "OOH Audience Verification API",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected"
    }


# -------------------------------------------------------------
# Authentication Routes
# -------------------------------------------------------------
@app.post("/auth/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    org_name = (req.organization_name or "Default Organization").strip()
    org = db.query(Organization).filter(Organization.name == org_name).first()
    if not org:
        org = Organization(name=org_name)
        db.add(org)
        db.commit()
        db.refresh(org)

    new_user = User(
        email=req.email.lower().strip(),
        hashed_password=hash_password(req.password),
        organization_id=org.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id, new_user.email, org.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "organization_id": org.id,
            "organization_name": org.name
        }
    }


@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    token = create_access_token(user.id, user.email, user.organization_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "organization_id": user.organization_id,
            "organization_name": org.name if org else "Default Workspace"
        }
    }


@app.post("/auth/google")
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Real Google OAuth verification.
    Verifies the Google ID token against Google's tokeninfo API.
    """
    if not req.credential:
        raise HTTPException(status_code=400, detail="Missing Google credential token")

    # Verify ID Token with Google tokeninfo endpoint
    try:
        verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={req.credential}"
        resp = requests.get(verify_url, timeout=5)
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Google token verification failed with provider")
        payload = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google authentication service error: {str(e)}")

    email = payload.get("email")
    if not email or not payload.get("email_verified", True):
        raise HTTPException(status_code=400, detail="Google account has unverified or missing email")

    # Optional audience check if GOOGLE_CLIENT_ID is configured
    if GOOGLE_CLIENT_ID and payload.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Google token audience mismatch")

    email = email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        org_name = payload.get("name", "Google Workspace Org")
        org = Organization(name=f"{org_name}'s Org")
        db.add(org)
        db.commit()
        db.refresh(org)

        # Create user with generated secure random password
        user = User(
            email=email,
            hashed_password=hash_password(os.urandom(24).hex()),
            organization_id=org.id
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    token = create_access_token(user.id, user.email, user.organization_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "organization_id": user.organization_id,
            "organization_name": org.name if org else "Default Workspace"
        }
    }


@app.get("/auth/me")
def get_me(user: User = Depends(require_current_user), db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == user.organization_id).first()
    return {
        "id": user.id,
        "email": user.email,
        "organization_id": user.organization_id,
        "organization_name": org.name if org else "Default Workspace",
        "created_at": user.created_at.isoformat() if user.created_at else None
    }


# -------------------------------------------------------------
# Organizations & Sites Routes
# -------------------------------------------------------------
@app.post("/organizations/")
def create_organization(org: OrganizationCreate, db: Session = Depends(get_db)):
    db_org = Organization(name=org.name)
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org


@app.get("/organizations/")
def list_organizations(db: Session = Depends(get_db)):
    return db.query(Organization).all()


@app.post("/sites/")
def create_site(site: SiteCreate, db: Session = Depends(get_db)):
    org_id = site.organization_id
    if not org_id:
        default_org = db.query(Organization).first()
        org_id = default_org.id if default_org else 1

    db_site = Site(name=site.name, location=site.location, organization_id=org_id)
    db.add(db_site)
    db.commit()
    db.refresh(db_site)
    return {
        "id": db_site.id,
        "name": db_site.name,
        "location": db_site.location,
        "organization_id": db_site.organization_id,
        "created_at": db_site.created_at.isoformat() if db_site.created_at else None
    }


@app.get("/sites/")
def list_sites(db: Session = Depends(get_db)):
    sites = db.query(Site).all()
    results = []
    for s in sites:
        videos = db.query(Video).filter(Video.site_id == s.id).all()
        video_ids = [v.id for v in videos]
        jobs = db.query(ProcessingJob).filter(ProcessingJob.video_id.in_(video_ids)).all() if video_ids else []
        
        latest_job = jobs[-1] if jobs else None
        completed_jobs = [j for j in jobs if j.status == "completed"]
        
        results.append({
            "id": s.id,
            "name": s.name,
            "location": s.location,
            "organization_id": s.organization_id,
            "organization_name": s.organization.name if s.organization else "Workspace",
            "video_count": len(videos),
            "jobs_count": len(jobs),
            "completed_jobs_count": len(completed_jobs),
            "latest_result": {
                "total_tracked_persons": latest_job.total_tracked_ids if latest_job else 0,
                "measurable_exposures": latest_job.total_exposures if latest_job else 0,
                "status": latest_job.status if latest_job else "none",
                "video_id": latest_job.video_id if latest_job else None
            } if latest_job else None,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return results


@app.get("/sites/{site_id}")
def get_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    videos = db.query(Video).filter(Video.site_id == site.id).order_by(desc(Video.id)).all()
    video_list = []
    for v in videos:
        job = db.query(ProcessingJob).filter(ProcessingJob.video_id == v.id).first()
        campaign_name = "Campaign Analysis"
        if job and job.roi_config:
            try:
                cfg = json.loads(job.roi_config)
                if isinstance(cfg, dict) and "campaign_name" in cfg:
                    campaign_name = cfg["campaign_name"]
            except Exception:
                pass
        
        video_list.append({
            "id": v.id,
            "filename": v.filename,
            "campaign_name": campaign_name,
            "uploaded_at": v.uploaded_at.isoformat() if v.uploaded_at else None,
            "job": {
                "id": job.id,
                "status": job.status,
                "total_frames": job.total_frames,
                "total_tracked_ids": job.total_tracked_ids,
                "total_exposures": job.total_exposures,
                "dwell_threshold": job.dwell_threshold or 2.0,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None
            } if job else None
        })

    return {
        "id": site.id,
        "name": site.name,
        "location": site.location,
        "organization_id": site.organization_id,
        "organization_name": site.organization.name if site.organization else "Workspace",
        "created_at": site.created_at.isoformat() if site.created_at else None,
        "videos": video_list
    }


# -------------------------------------------------------------
# Jobs Routes
# -------------------------------------------------------------
@app.get("/jobs/")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(ProcessingJob).order_by(desc(ProcessingJob.id)).all()
    results = []
    for j in jobs:
        video = db.query(Video).filter(Video.id == j.video_id).first()
        site = db.query(Site).filter(Site.id == video.site_id).first() if video else None
        
        campaign_name = "Campaign Analysis"
        if j.roi_config:
            try:
                cfg = json.loads(j.roi_config)
                if isinstance(cfg, dict) and "campaign_name" in cfg:
                    campaign_name = cfg["campaign_name"]
            except Exception:
                pass

        results.append({
            "id": j.id,
            "video_id": j.video_id,
            "filename": video.filename if video else "Unknown Video",
            "campaign_name": campaign_name,
            "site_id": site.id if site else None,
            "site_name": site.name if site else "Default Site",
            "status": j.status,
            "total_frames": j.total_frames or 0,
            "total_tracked_ids": j.total_tracked_ids or 0,
            "total_exposures": j.total_exposures or 0,
            "dwell_threshold": j.dwell_threshold or 2.0,
            "output_video_path": j.output_video_path,
            "error_message": j.error_message,
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None
        })
    return results


@app.get("/jobs/{job_id}")
def get_job_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    video = db.query(Video).filter(Video.id == job.video_id).first()
    site = db.query(Site).filter(Site.id == video.site_id).first() if video else None
    
    campaign_name = "Campaign Analysis"
    if job.roi_config:
        try:
            cfg = json.loads(job.roi_config)
            if isinstance(cfg, dict) and "campaign_name" in cfg:
                campaign_name = cfg["campaign_name"]
        except Exception:
            pass

    return {
        "id": job.id,
        "video_id": job.video_id,
        "filename": video.filename if video else "Unknown Video",
        "campaign_name": campaign_name,
        "site_id": site.id if site else None,
        "site_name": site.name if site else "Default Site",
        "status": job.status,
        "total_frames": job.total_frames or 0,
        "total_tracked_ids": job.total_tracked_ids or 0,
        "total_exposures": job.total_exposures or 0,
        "dwell_threshold": job.dwell_threshold or 2.0,
        "roi_config": job.roi_config,
        "output_video_path": job.output_video_path,
        "error_message": job.error_message,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None
    }


# -------------------------------------------------------------
# Video Upload & Analysis Initiation
# -------------------------------------------------------------
@app.post("/videos/upload/")
async def upload_video(
    site_id: int = Form(...),
    campaign_name: Optional[str] = Form(None),
    dwell_threshold: float = Form(2.0),
    roi_config: Optional[str] = Form(None),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    safe_filename = file.filename.replace(" ", "_")
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_video = Video(filename=safe_filename, file_path=file_path, site_id=site_id)
    db.add(db_video)
    db.commit()
    db.refresh(db_video)

    parsed_roi = None
    stored_roi_dict = {}
    if roi_config:
        try:
            parsed = json.loads(roi_config)
            if isinstance(parsed, list):
                parsed_roi = parsed
                stored_roi_dict = {"points": parsed, "campaign_name": campaign_name or "Campaign Analysis"}
            elif isinstance(parsed, dict):
                parsed_roi = parsed.get("points")
                stored_roi_dict = parsed
                if campaign_name:
                    stored_roi_dict["campaign_name"] = campaign_name
        except Exception:
            pass

    if not stored_roi_dict and campaign_name:
        stored_roi_dict = {"campaign_name": campaign_name}

    output_path = os.path.join(OUTPUT_DIR, f"processed_{safe_filename}")
    db_job = ProcessingJob(
        video_id=db_video.id,
        status="queued",
        dwell_threshold=dwell_threshold,
        roi_config=json.dumps(stored_roi_dict) if stored_roi_dict else None
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    # Enqueue background CV pipeline
    background_tasks.add_task(
        run_processing_pipeline,
        db_job.id,
        file_path,
        output_path,
        parsed_roi,
        dwell_threshold
    )

    return {
        "message": "Video uploaded successfully and queued for processing",
        "video_id": db_video.id,
        "job_id": db_job.id,
        "status": "queued"
    }


class SampleAnalysisRequest(BaseModel):
    site_id: int
    campaign_name: Optional[str] = "Piccadilly Summer Exposure Study"
    dwell_threshold: Optional[float] = 2.0
    roi_config: Optional[str] = None


@app.post("/videos/analyze-sample/")
def analyze_sample_video(
    req: SampleAnalysisRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Instantly initiates real CV analysis on the included verified test video data/videos/ooh_test.mp4.
    """
    site = db.query(Site).filter(Site.id == req.site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    sample_src = os.path.join(UPLOAD_DIR, "ooh_test.mp4")
    if not os.path.exists(sample_src):
        raise HTTPException(status_code=404, detail="Sample video file ooh_test.mp4 not found on server")

    timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    run_filename = f"ooh_test_analysis_{timestamp_str}.mp4"
    run_video_path = os.path.join(UPLOAD_DIR, run_filename)
    shutil.copyfile(sample_src, run_video_path)

    db_video = Video(filename=run_filename, file_path=run_video_path, site_id=site.id)
    db.add(db_video)
    db.commit()
    db.refresh(db_video)

    parsed_roi = None
    stored_roi_dict = {}
    if req.roi_config:
        try:
            parsed = json.loads(req.roi_config)
            if isinstance(parsed, list):
                parsed_roi = parsed
                stored_roi_dict = {"points": parsed, "campaign_name": req.campaign_name}
            elif isinstance(parsed, dict):
                parsed_roi = parsed.get("points")
                stored_roi_dict = parsed
                if req.campaign_name:
                    stored_roi_dict["campaign_name"] = req.campaign_name
        except Exception:
            pass

    if not stored_roi_dict:
        stored_roi_dict = {
            "points": [[0.3, 0.3], [0.7, 0.3], [0.7, 0.7], [0.3, 0.7]],
            "campaign_name": req.campaign_name or "Campaign Analysis"
        }
        parsed_roi = stored_roi_dict["points"]

    output_path = os.path.join(OUTPUT_DIR, f"processed_{run_filename}")
    db_job = ProcessingJob(
        video_id=db_video.id,
        status="queued",
        dwell_threshold=req.dwell_threshold or 2.0,
        roi_config=json.dumps(stored_roi_dict)
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    background_tasks.add_task(
        run_processing_pipeline,
        db_job.id,
        run_video_path,
        output_path,
        parsed_roi,
        req.dwell_threshold or 2.0
    )

    return {
        "message": "Analysis queued on sample video",
        "video_id": db_video.id,
        "job_id": db_job.id,
        "status": "queued"
    }


# -------------------------------------------------------------
# Results & Exposure Details
# -------------------------------------------------------------
@app.get("/results/{video_id}")
def get_video_results(video_id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    job = db.query(ProcessingJob).filter(ProcessingJob.video_id == video_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found for this video")

    site = db.query(Site).filter(Site.id == video.site_id).first()
    events = db.query(ExposureEvent).filter(ExposureEvent.job_id == job.id).order_by(ExposureEvent.entry_time).all()

    avg_dwell = sum([e.dwell_seconds for e in events]) / len(events) if events else 0.0

    campaign_name = "Campaign Analysis"
    parsed_roi_points = None
    if job.roi_config:
        try:
            cfg = json.loads(job.roi_config)
            if isinstance(cfg, dict):
                campaign_name = cfg.get("campaign_name", campaign_name)
                parsed_roi_points = cfg.get("points")
            elif isinstance(cfg, list):
                parsed_roi_points = cfg
        except Exception:
            pass

    # Normalize output video URL
    output_url = None
    if job.output_video_path:
        filename = os.path.basename(job.output_video_path)
        output_url = f"/outputs/{filename}"

    return {
        "video_id": video.id,
        "job_id": job.id,
        "filename": video.filename,
        "campaign_name": campaign_name,
        "site_id": site.id if site else None,
        "site_name": site.name if site else "Default Site",
        "site_location": site.location if site else None,
        "job_status": job.status,
        "total_frames": job.total_frames or 0,
        "unique_tracked_persons": job.total_tracked_ids or 0,
        "measurable_exposure_events": job.total_exposures or len(events),
        "average_dwell_time_seconds": round(avg_dwell, 2),
        "dwell_threshold": job.dwell_threshold or 2.0,
        "roi_points": parsed_roi_points,
        "output_video_path": job.output_video_path,
        "output_video_url": output_url,
        "exposure_events": [
            {
                "id": e.id,
                "tracking_id": e.tracking_id,
                "entry_time": round(e.entry_time, 2),
                "dwell_seconds": round(e.dwell_seconds, 2),
                "exposure": e.exposure
            } for e in events
        ],
        "error_message": job.error_message,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None
    }


@app.get("/results/job/{job_id}")
def get_job_results(job_id: int, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return get_video_results(job.video_id, db)


# -------------------------------------------------------------
# Audience Analytics (Real PostgreSQL Data Aggregation)
# -------------------------------------------------------------
@app.get("/analytics/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    total_sites = db.query(Site).count()
    completed_jobs = db.query(ProcessingJob).filter(ProcessingJob.status == "completed").all()

    all_events = db.query(ExposureEvent).all()
    total_exposures = len(all_events)
    avg_dwell = (sum([e.dwell_seconds for e in all_events]) / total_exposures) if total_exposures > 0 else 0.0
    total_tracked = sum([j.total_tracked_ids or 0 for j in completed_jobs])

    # Real Dwell Duration distribution buckets
    distribution = {
        "2.0s - 3.0s": 0,
        "3.0s - 4.0s": 0,
        "4.0s - 5.0s": 0,
        "5.0s+": 0
    }
    for e in all_events:
        d = e.dwell_seconds
        if d < 3.0:
            distribution["2.0s - 3.0s"] += 1
        elif d < 4.0:
            distribution["3.0s - 4.0s"] += 1
        elif d < 5.0:
            distribution["4.0s - 5.0s"] += 1
        else:
            distribution["5.0s+"] += 1

    # Analysis history summary
    analyses = []
    for j in completed_jobs:
        video = db.query(Video).filter(Video.id == j.video_id).first()
        site = db.query(Site).filter(Site.id == video.site_id).first() if video else None
        
        cname = "Campaign Analysis"
        if j.roi_config:
            try:
                cfg = json.loads(j.roi_config)
                if isinstance(cfg, dict) and "campaign_name" in cfg:
                    cname = cfg["campaign_name"]
            except Exception:
                pass

        job_events = db.query(ExposureEvent).filter(ExposureEvent.job_id == j.id).all()
        job_avg_dwell = (sum([ev.dwell_seconds for ev in job_events]) / len(job_events)) if job_events else 0.0

        analyses.append({
            "job_id": j.id,
            "video_id": j.video_id,
            "filename": video.filename if video else "Video",
            "campaign_name": cname,
            "site_name": site.name if site else "Site",
            "site_location": site.location if site else "",
            "tracked_persons": j.total_tracked_ids or 0,
            "exposure_events": j.total_exposures or len(job_events),
            "avg_dwell_seconds": round(job_avg_dwell, 2),
            "dwell_threshold": j.dwell_threshold or 2.0,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None
        })

    return {
        "summary": {
            "total_sites": total_sites,
            "completed_jobs": len(completed_jobs),
            "total_tracked_persons": total_tracked,
            "total_measurable_exposures": total_exposures,
            "overall_average_dwell_seconds": round(avg_dwell, 2)
        },
        "dwell_distribution": distribution,
        "analyses": analyses
    }


# -------------------------------------------------------------
# Reports Routes
# -------------------------------------------------------------
@app.get("/reports/{video_id}")
def get_analysis_report(video_id: int, db: Session = Depends(get_db)):
    results = get_video_results(video_id, db)
    
    return {
        "report_id": f"REP-OOH-{results['job_id']:04d}-{video_id:04d}",
        "generated_at": datetime.utcnow().isoformat(),
        "metadata": {
            "title": f"Audience Exposure Verification Report — {results['campaign_name']}",
            "site": {
                "name": results["site_name"],
                "location": results["site_location"]
            },
            "video": {
                "id": results["video_id"],
                "filename": results["filename"]
            },
            "pipeline": {
                "detector": "Ultralytics YOLOv8n (Person Class 0)",
                "tracker": "ByteTrack Multi-Object Tracking",
                "dwell_threshold_seconds": results["dwell_threshold"],
                "total_frames_analyzed": results["total_frames"]
            }
        },
        "metrics": {
            "unique_tracked_persons": results["unique_tracked_persons"],
            "measurable_exposure_events": results["measurable_exposure_events"],
            "average_dwell_time_seconds": results["average_dwell_time_seconds"],
            "exposure_conversion_rate": round(
                (results["measurable_exposure_events"] / results["unique_tracked_persons"] * 100) 
                if results["unique_tracked_persons"] > 0 else 0, 
                2
            )
        },
        "evidence_sample": results["exposure_events"][:50],
        "methodology": {
            "definition": "An exposure event is recorded exclusively when an individual detected by YOLOv8 and tracked via ByteTrack enters the predefined viewing zone ROI and remains continuously for at least the specified minimum dwell threshold.",
            "roi_configuration": "Polygon zone projected onto billboard line-of-sight coordinates.",
            "privacy_standard": "All person detections are fully anonymized. Bounding boxes are processed transiently with no facial recognition, demographic classification, biometrics, or PII stored."
        },
        "limitations": [
            "Measures physical presence and dwell time inside the defined viewing cone, not individual gaze direction or cognitive attention.",
            "Subject to optical occlusions (e.g. umbrella cover, heavy vehicle obstruction) typical of ambient urban camera capture.",
            "Does not identify viewers or cross-reference external datasets."
        ]
    }
