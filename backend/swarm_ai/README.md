# Swarm AI Microservice

This microservice provides distributed task allocation, leader election, and group key sync for drone swarms.

## Features
- REST API for:
  - Assigning tasks to drones (`/assign-task`)
  - Reporting drone status (`/report-status`)
  - Leader election (`/elect-leader`)
  - Group key sync (`/group-key`)
- Modular: does not affect your main backend or UI

## Endpoints
- `GET /health` — Health check
- `POST /assign-task` — Assign a task to a drone
- `POST /report-status` — Report drone status
- `POST /elect-leader` — Elect a leader among drones
- `GET /group-key` — Get the current group key (stub)

## How to Run
```bash
cd backend/swarm_ai
pip install fastapi uvicorn pydantic
python swarm_ai.py
```

## Integration
- Connect your backend or dashboard to this service for swarm AI logic.
- Extend with real distributed algorithms as needed. 

## Quick Integration Example

**Assign a task (Node.js/JS):**
```js
fetch('http://localhost:5700/assign-task', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ drone_id: 'drone1', task: 'scan-area' })
});
```

**Elect a leader (Node.js/JS):**
```js
fetch('http://localhost:5700/elect-leader', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(['drone1', 'drone2', 'drone3'])
})
  .then(res => res.json())
  .then(console.log);
``` 