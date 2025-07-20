from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from ultralytics import YOLO
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 model (downloads weights if not present)
model = YOLO('yolov8n.pt')  # You can use yolov8s.pt, yolov8m.pt, etc.

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    results = model(image)
    detections = results[0].boxes.xyxy.cpu().numpy().tolist()
    names = results[0].names
    classes = results[0].boxes.cls.cpu().numpy().tolist()
    confs = results[0].boxes.conf.cpu().numpy().tolist()
    output = []
    for i, box in enumerate(detections):
        output.append({
            "name": names[int(classes[i])],
            "confidence": confs[i],
            "xmin": box[0],
            "ymin": box[1],
            "xmax": box[2],
            "ymax": box[3]
        })
    return JSONResponse(content={"detections": output})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001) 