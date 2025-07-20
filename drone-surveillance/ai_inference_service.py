from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from ultralytics import YOLO
from PIL import Image, ImageDraw, ImageFont
import io
import os

app = FastAPI()

# Allow CORS for all origins (so frontend can call this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model loading ---
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")  # Change to your custom model if needed
model = YOLO(MODEL_PATH)

# --- Class name mapping (COCO by default, update for custom model) ---
COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator",
    "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
]
# If you have a custom model, replace COCO_CLASSES with your own class list.

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), return_image: bool = False):
    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        results = model(image)
        detections = []
        draw = ImageDraw.Draw(image)
        font = None
        try:
            font = ImageFont.truetype("arial.ttf", 18)
        except:
            font = None

        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = [float(x) for x in box.xyxy[0]]
            class_name = COCO_CLASSES[cls_id] if cls_id < len(COCO_CLASSES) else str(cls_id)
            detections.append({
                "class_id": cls_id,
                "class_name": class_name,
                "confidence": conf,
                "bbox": xyxy
            })
            # Draw bounding box if image return requested
            if return_image:
                draw.rectangle(xyxy, outline="red", width=2)
                label = f"{class_name} {conf:.2f}"
                if font:
                    draw.text((xyxy[0], xyxy[1] - 20), label, fill="red", font=font)
                else:
                    draw.text((xyxy[0], xyxy[1] - 20), label, fill="red")

        if return_image:
            buf = io.BytesIO()
            image.save(buf, format="JPEG")
            buf.seek(0)
            return StreamingResponse(buf, media_type="image/jpeg")

        return {"detections": detections}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)}) 