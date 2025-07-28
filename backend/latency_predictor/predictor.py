# latency_predictor/predictor.py
# Microservice for latency handling and predictive buffer logic

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LatencyReport(BaseModel):
    drone_id: str
    latency_ms: float
    timestamp: Optional[float] = None

class BufferStateRequest(BaseModel):
    drone_id: str

# In-memory buffer state (stub)
buffer_states = {}

@app.get("/health")
def health():
    return {"status": "ok", "service": "latency_predictor"}

@app.post("/report-latency")
def report_latency(report: LatencyReport):
    # Store or process latency (stub)
    buffer_states[report.drone_id] = {"latency_ms": report.latency_ms, "timestamp": report.timestamp}
    return {"status": "received", "drone_id": report.drone_id}

@app.post("/buffer-state")
def buffer_state(req: BufferStateRequest):
    # Return buffer state (stub)
    state = buffer_states.get(req.drone_id, {"latency_ms": None, "timestamp": None})
    return {"drone_id": req.drone_id, "buffer_state": state}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5500) 