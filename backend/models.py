from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sites = relationship("Site", back_populates="organization")
    users = relationship("User", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")


class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    location = Column(String)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="sites")
    videos = relationship("Video", back_populates="site")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    site = relationship("Site", back_populates="videos")
    processing_job = relationship("ProcessingJob", back_populates="video", uselist=False)


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    status = Column(String, default="queued")  # queued, processing, completed, failed
    total_frames = Column(Integer, default=0)
    total_tracked_ids = Column(Integer, default=0)
    total_exposures = Column(Integer, default=0)
    dwell_threshold = Column(Float, default=2.0)
    roi_config = Column(Text, nullable=True) # JSON representation of ROI points
    output_video_path = Column(String)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    video = relationship("Video", back_populates="processing_job")
    exposure_events = relationship("ExposureEvent", back_populates="job")


class ExposureEvent(Base):
    __tablename__ = "exposure_events"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("processing_jobs.id"))
    tracking_id = Column(Integer, nullable=False)
    entry_time = Column(Float, nullable=False)
    dwell_seconds = Column(Float, nullable=False)
    exposure = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("ProcessingJob", back_populates="exposure_events")
