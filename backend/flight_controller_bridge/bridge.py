# flight_controller_bridge/bridge.py
# Microservice to bridge dashboard/backend with real drone firmware (PX4/ArduPilot/ROS)
# Exposes REST and WebSocket endpoints for command/telemetry

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()

# Allow CORS for local dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for connected WebSocket clients
clients = set()

@app.get("/health")
def health():
    return {"status": "ok", "service": "flight_controller_bridge"}

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Here, you would parse MAVLink/ROS messages and forward to dashboard
            # For now, just echo
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        clients.remove(websocket)

@app.post("/api/send-command")
async def send_command(command: dict):
    # Here, you would send the command to the drone via MAVLink/ROS
    # For now, just return the command
    return {"status": "sent", "command": command}

# To connect to PX4/ArduPilot/ROS, add MAVLink/ROS client code here
# Example: pymavlink, mavsdk, or rospy/ros2py

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5100) 