from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import numpy as np
from ultralytics import YOLO
from PIL import Image
import io
import os
import shutil
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import Base, engine, SessionLocal, Detection, DetectedObject, get_db
import asyncio

app = FastAPI(title="Military Asset Detection AI")

# Load YOLOv8 model (pretrained for demonstration)
model = YOLO("yolov8m.pt")  # You can replace with your custom .pt file

# Example class mapping and threat levels (expand as needed)
CLASS_MAP = {
    0: "person",  # Will map to "Soldier" for demo
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",  # Will map to "Military Vehicle"
    # ... add more as needed
}
THREAT_LEVELS = {
    "Tank": "High",
    "Helicopter": "High",
    "Air Defense System": "High",
    "Missile System": "High",
    "Soldier": "Low",
    "Military Vehicle": "Medium",
    # ... add more as needed
}

# Map YOLO classes to military types for demo
YOLO_TO_MILITARY = {
    "person": "Soldier",
    "truck": "Military Vehicle",
    # ... add more mappings as needed
}

class DetectedObject(BaseModel):
    type: str
    bounding_box: List[float]
    confidence: float
    threat_level: str

class AnalyzeResponse(BaseModel):
    timestamp: str
    coordinates: Dict[str, float]
    detected_objects: List[DetectedObject]

class DescriptionResponse(BaseModel):
    description: str
    detected_objects: List[str]

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    lat: float = Form(...),
    long: float = Form(...),
    timestamp: str = Form(None),
    db: AsyncSession = Depends(get_db)
):
    # Save uploaded image to disk (optional, for reference)
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    save_dir = "images"
    os.makedirs(save_dir, exist_ok=True)
    image_filename = f"{datetime.utcnow().timestamp()}_{file.filename}"
    image_path = os.path.join(save_dir, image_filename)
    image.save(image_path)

    # Run YOLO inference
    results = model(image)
    detected_objects = []
    db_objects = []
    for r in results[0].boxes:
        class_id = int(r.cls)
        # Use model.names if available, else fallback
        yolo_names = getattr(model, 'names', None)
        if yolo_names is None and hasattr(model, 'model') and hasattr(model.model, 'names'):
            yolo_names = model.model.names
        if isinstance(yolo_names, dict):
            yolo_class = yolo_names.get(class_id, str(class_id))
        elif isinstance(yolo_names, list):
            yolo_class = yolo_names[class_id] if class_id < len(yolo_names) else str(class_id)
        else:
            yolo_class = str(class_id)
        military_type = YOLO_TO_MILITARY.get(yolo_class, yolo_class.capitalize() if yolo_class else "Unknown")
        confidence = float(r.conf)
        bbox = r.xyxy.tolist()[0]
        threat_level = THREAT_LEVELS.get(military_type, "Low")
        detected_objects.append(DetectedObject(
            type=military_type or "Unknown",
            bounding_box=bbox,
            confidence=confidence,
            threat_level=threat_level
        ))
        db_objects.append({
            "type": military_type or "Unknown",
            "bounding_box": bbox,
            "confidence": confidence,
            "threat_level": threat_level
        })
    # Store detection in DB
    det_time = datetime.fromisoformat(timestamp) if timestamp else datetime.utcnow()
    detection = Detection(
        timestamp=det_time,
        lat=lat,
        long=long,
        image_path=image_path
    )
    db.add(detection)
    await db.flush()  # Get detection.id
    for obj in db_objects:
        db_obj = DetectedObject(
            detection_id=detection.id,
            type=obj["type"],
            bounding_box=obj["bounding_box"],
            confidence=obj["confidence"],
            threat_level=obj["threat_level"]
        )
        db.add(db_obj)
    await db.commit()
    return {
        "timestamp": det_time.isoformat(),
        "coordinates": {"lat": lat, "long": long},
        "detected_objects": detected_objects
    }

@app.post("/describe", response_model=DescriptionResponse)
async def describe_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model(image)
    class_counts = {}
    yolo_names = getattr(model, 'names', None)
    if yolo_names is None and hasattr(model, 'model') and hasattr(model.model, 'names'):
        yolo_names = model.model.names
    for r in results[0].boxes:
        class_id = int(r.cls)
        if isinstance(yolo_names, dict):
            class_name = yolo_names.get(class_id, str(class_id))
        elif isinstance(yolo_names, list):
            class_name = yolo_names[class_id] if class_id < len(yolo_names) else str(class_id)
        else:
            class_name = str(class_id)
        class_counts[class_name] = class_counts.get(class_name, 0) + 1
    if not class_counts:
        description = "No known objects detected in the image."
    else:
        parts = [f"{v} {k}{'s' if v > 1 else ''}" for k, v in class_counts.items()]
        description = "Detected " + ", ".join(parts) + " in the image."
    return {
        "description": description,
        "detected_objects": list(class_counts.keys())
    }

@app.get("/detections")
async def get_detections(limit: int = 10, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Detection).order_by(Detection.timestamp.desc()).limit(limit))
    detections = result.scalars().all()
    output = []
    for det in detections:
        objs = []
        for obj in det.objects:
            objs.append({
                "type": obj.type,
                "bounding_box": obj.bounding_box,
                "confidence": obj.confidence,
                "threat_level": obj.threat_level
            })
        output.append({
            "timestamp": det.timestamp.isoformat(),
            "coordinates": {"lat": det.lat, "long": det.long},
            "image_path": det.image_path,
            "detected_objects": objs
        })
    return output

@app.get("/health")
def health():
    return {"status": "ok"} 