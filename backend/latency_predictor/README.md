# Latency Predictor Microservice

This microservice provides latency handling and predictive buffer logic for robust drone operation during network lag or dropouts.

## Features
- REST API for:
  - Reporting latency (`/report-latency`)
  - Querying buffer state (`/buffer-state`)
- Modular: does not affect your main backend or UI

## Endpoints
- `GET /health` — Health check
- `POST /report-latency` — Report current latency
- `POST /buffer-state` — Get predictive buffer state for a drone

## How to Run
```bash
cd backend/latency_predictor
pip install fastapi uvicorn pydantic
python predictor.py
```

## Integration
- Connect your backend or dashboard to this service for latency monitoring and predictive control.
- Extend with real predictive buffer logic as needed. 

## Quick Integration Example

**Report latency (Node.js/JS):**
```js
fetch('http://localhost:5500/report-latency', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ drone_id: 'drone1', latency_ms: 45.2 })
});
```

**Get buffer state (Node.js/JS):**
```js
fetch('http://localhost:5500/buffer-state', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ drone_id: 'drone1' })
})
  .then(res => res.json())
  .then(console.log);
``` 