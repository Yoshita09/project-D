# Sensor Fusion Microservice

This microservice fuses data from GPS, IMU, LiDAR, and camera sensors to provide a unified state for drones.

## Features
- REST API for:
  - Sensor fusion (`/fuse-sensors`)
- Modular: does not affect your main backend or UI

## Endpoints
- `GET /health` — Health check
- `POST /fuse-sensors` — Fuse sensor data and return a unified state

## How to Run
```bash
cd backend/sensor_fusion
pip install fastapi uvicorn pydantic
python fusion.py
```

## Integration
- Connect your backend or dashboard to this service via REST for sensor fusion.
- Extend with real fusion algorithms as needed. 

## Quick Integration Example

**Fuse sensor data (Node.js/JS):**
```js
fetch('http://localhost:5300/fuse-sensors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gps: [28.6139, 77.2090, 200],
    imu: [0, 0, 0, 0, 0, 0],
    lidar: [5.2, 4.8, 6.1],
    camera: 'base64string'
  })
})
  .then(res => res.json())
  .then(console.log);
``` 