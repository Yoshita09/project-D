// swarm_comm_broker/broker.js
// Microservice for real-time swarm communication (MQTT broker)

const aedes = require('aedes')();
const net = require('net');
const express = require('express');
const cors = require('cors');

const MQTT_PORT = 5400;
const HTTP_PORT = 5401;

// Start MQTT broker
const server = net.createServer(aedes.handle);
server.listen(MQTT_PORT, function () {
  console.log('MQTT broker started on port', MQTT_PORT);
});

// Express app for health check
const app = express();
app.use(cors());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'swarm_comm_broker' });
});

app.listen(HTTP_PORT, () => {
  console.log('Swarm Comm Broker health endpoint on port', HTTP_PORT);
});

// Integration:
// - Drones and dashboard connect to MQTT broker at ws://localhost:5400
// - Use topics like 'drone/+/telemetry', 'swarm/commands', etc. 