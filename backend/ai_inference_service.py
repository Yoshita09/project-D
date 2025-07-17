from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import torch
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

# Load YOLOv5 model (downloads weights if not present)
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    results = model(image)
    detections = results.pandas().xyxy[0].to_dict(orient='records')
    return JSONResponse(content={"detections": detections})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001) 