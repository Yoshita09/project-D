const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8090 });

console.log('Telemetry WebSocket server running on ws://localhost:8090');

function sendDemoTelemetry(ws) {
  const drones = [
    { id: 'Pinaak-01', lat: 28.6139 + Math.random() * 0.01, lng: 77.2090 + Math.random() * 0.01, battery: 80 + Math.random() * 20, speed: 40 + Math.random() * 10, status: 'Active' },
    { id: 'Akash-02', lat: 28.615 + Math.random() * 0.01, lng: 77.215 + Math.random() * 0.01, battery: 70 + Math.random() * 20, speed: 35 + Math.random() * 10, status: 'Active' },
    { id: 'Prithvi-03', lat: 28.617 + Math.random() * 0.01, lng: 77.212 + Math.random() * 0.01, battery: 60 + Math.random() * 20, speed: 30 + Math.random() * 10, status: 'Active' },
    { id: 'Arjun-04', lat: 28.618 + Math.random() * 0.01, lng: 77.218 + Math.random() * 0.01, battery: 90 + Math.random() * 10, speed: 45 + Math.random() * 10, status: 'Active' }
  ];
  drones.forEach(drone => {
    ws.send(JSON.stringify({
      type: 'telemetry',
      droneId: drone.id,
      lat: drone.lat,
      lng: drone.lng,
      battery: drone.battery,
      speed: drone.speed,
      status: drone.status,
      time: new Date().toISOString().replace('T', ' ').slice(0, 19)
    }));
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected to Telemetry WebSocket');
  // Send telemetry every 2 seconds
  const interval = setInterval(() => sendDemoTelemetry(ws), 2000);

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'command') {
        console.log('Received command:', data);
        // Echo back as an acknowledgement
        ws.send(JSON.stringify({ type: 'command_ack', ...data, ack: true, time: new Date().toISOString() }));
      }
    } catch (e) {
      console.error('Invalid message:', msg);
    }
  });

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
}); 