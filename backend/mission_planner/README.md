# Mission Planner Microservice

This microservice provides advanced path planning (A*, RRT, Dijkstra) and mission state machine logic for drones.

## Features
- REST API for:
  - Path planning (`/plan-path`)
  - Mission state management (`/mission-state`)
- Modular: does not affect your main backend or UI

## Endpoints
- `GET /health` — Health check
- `POST /plan-path` — Plan a path using A*, RRT, or Dijkstra
- `POST /mission-state` — Update or query mission state

## How to Run
```bash
cd backend/mission_planner
pip install fastapi uvicorn pydantic
python planner.py
```

## Integration
- Connect your dashboard/backend to this service via REST for mission planning and state management.
- Extend with real path planning algorithms as needed. 

## Quick Integration Example

**Request a path (Node.js/JS):**
```js
fetch('http://localhost:5200/plan-path', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    start: [28.6139, 77.2090],
    goal: [28.6145, 77.2100],
    obstacles: [],
    algorithm: 'astar'
  })
})
  .then(res => res.json())
  .then(console.log);
``` 