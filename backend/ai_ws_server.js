const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080, path: '/ai' });

console.log('AI WebSocket server running on ws://localhost:8080/ai');

function sendDemoDetection(ws) {
  const drones = ['Pinaak-01', 'Akash-02', 'Prithvi-03', 'Arjun-04'];
  const detections = ['Person', 'Vehicle', 'Animal', 'Unknown Object'];
  const alerts = ['None', 'Suspicious Vehicle', 'Potential Threat'];
  const idx = Math.floor(Math.random() * drones.length);
  const detection = {
    type: 'ai_detection',
    droneId: drones[idx],
    detection: detections[Math.floor(Math.random() * detections.length)],
    confidence: (0.6 + Math.random() * 0.4).toFixed(2),
    time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    alert: Math.random() > 0.7 ? alerts[Math.floor(Math.random() * alerts.length)] : 'None'
  };
  ws.send(JSON.stringify(detection));
}

wss.on('connection', (ws) => {
  console.log('Client connected to AI WebSocket');
  // Send a detection every 2 seconds (simulate real-time)
  const interval = setInterval(() => sendDemoDetection(ws), 2000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
}); 