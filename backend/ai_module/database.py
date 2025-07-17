from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/ai_detection")

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

class Detection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False)
    lat = Column(Float, nullable=False)
    long = Column(Float, nullable=False)
    image_path = Column(String, nullable=True)  # Optional: path to stored image
    objects = relationship("DetectedObject", back_populates="detection")

class DetectedObject(Base):
    __tablename__ = "detected_objects"
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"))
    type = Column(String, nullable=False)
    bounding_box = Column(JSON, nullable=False)  # [x1, y1, x2, y2]
    confidence = Column(Float, nullable=False)
    threat_level = Column(String, nullable=False)
    detection = relationship("Detection", back_populates="objects")

# Dependency for FastAPI endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 