# Flight Controller Bridge Microservice

This microservice acts as a bridge between your backend/dashboard and real drone flight controllers (PX4, ArduPilot, or ROS-based systems).

## Features
- Exposes REST and WebSocket endpoints for:
  - Sending commands to drones
  - Receiving telemetry from drones
- Ready to connect to PX4/ArduPilot via MAVLink, or ROS via rospy/ros2py
- Modular: does not affect your main backend or UI

## Endpoints
- `GET /health` — Health check
- `POST /api/send-command` — Send a command to the drone (to be implemented with MAVLink/ROS)
- `WS /ws/telemetry` — Real-time telemetry stream (to be connected to drone firmware)

## Quick Integration Example

**Send a command (Node.js/JS):**
```js
fetch('http://localhost:5100/api/send-command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'TAKEOFF', params: { altitude: 10 } })
})
  .then(res => res.json())
  .then(console.log);
```

**Receive telemetry (WebSocket, JS):**
```js
const ws = new WebSocket('ws://localhost:5100/ws/telemetry');
ws.onmessage = (event) => {
  console.log('Telemetry:', event.data);
};
```

## How to Run
```bash
cd backend/flight_controller_bridge
pip install fastapi uvicorn
python bridge.py
```

## Integration
- Connect your dashboard/backend to this service via REST/WebSocket for real drone operations.
- Extend with MAVLink/ROS code as needed for your hardware. 