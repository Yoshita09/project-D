# Swarm Communication Broker Microservice

This microservice provides a real-time MQTT broker for secure, scalable swarm communication between drones and the dashboard.

## Features
- MQTT broker for:
  - Drone-to-drone and drone-to-dashboard messaging
  - Swarm coordination topics
- Health check endpoint via Express
- Modular: does not affect your main backend or UI

## Endpoints
- MQTT broker: `ws://localhost:5400`
- Health check: `GET http://localhost:5401/health`

## How to Run
```bash
cd backend/swarm_comm_broker
npm install aedes express cors
node broker.js
```

## Integration
- Drones and dashboard connect to the MQTT broker for real-time messaging.
- Use topics like `drone/+/telemetry`, `swarm/commands`, etc. 

## Quick Integration Example

**Subscribe to a topic (Node.js/JS):**
```js
const mqtt = require('mqtt');
const client = mqtt.connect('ws://localhost:5400');
client.on('connect', () => {
  client.subscribe('drone/+/telemetry');
});
client.on('message', (topic, message) => {
  console.log(topic, message.toString());
});
``` 