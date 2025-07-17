import React, { useEffect, useState } from 'react';
import useDroneWebSocket from '../hooks/useDroneWebSocket';
import './DroneDashboard.css'; // Reuse dashboard styles for consistency

const DEMO_AI_DATA = [
  { droneId: 'Pinaak-01', detection: 'Person', confidence: 0.92, time: '2024-06-01 12:01:23', alert: 'None' },
  { droneId: 'Akash-02', detection: 'Vehicle', confidence: 0.87, time: '2024-06-01 12:01:25', alert: 'Suspicious Vehicle' },
  { droneId: 'Prithvi-03', detection: 'Animal', confidence: 0.78, time: '2024-06-01 12:01:28', alert: 'None' },
  { droneId: 'Arjun-04', detection: 'Unknown Object', confidence: 0.65, time: '2024-06-01 12:01:30', alert: 'Potential Threat' },
];

// For demo, use a global AI WebSocket (replace with real endpoint)
const AI_WS_URL = 'ws://localhost:8080/ai';

export default function AIOutputPortal() {
  const [aiData, setAIData] = useState(DEMO_AI_DATA);
  // Use a global AI WebSocket (no droneId needed for all-drones feed)
  const { status, lastMessage } = useDroneWebSocket('all', AI_WS_URL);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'ai_detection') {
      // Message format: { type: 'ai_detection', droneId, detection, confidence, time, alert }
      setAIData(prev => {
        // Remove any previous detection for this droneId (keep only latest per drone)
        const filtered = prev.filter(row => row.droneId !== lastMessage.droneId);
        return [{
          droneId: lastMessage.droneId,
          detection: lastMessage.detection,
          confidence: lastMessage.confidence,
          time: lastMessage.time,
          alert: lastMessage.alert || 'None',
        }, ...filtered].slice(0, 50);
      });
    }
  }, [lastMessage]);

  return (
    <div className="dashboard-panel" style={{ minWidth: 400, maxWidth: 900, margin: '0 auto' }}>
      <h2>AI Output Portal</h2>
      <p style={{ color: '#888', marginBottom: 12 }}>
        Live AI detections, alerts, and analytics per drone
        <span style={{ float: 'right', fontSize: 13, color: status === 'connected' ? '#4CAF50' : '#ff4444' }}>
          {status === 'connected' ? 'Live' : 'Offline'}
        </span>
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table className="dashboard-table" style={{ width: '100%', minWidth: 600 }}>
          <thead>
            <tr>
              <th>Drone</th>
              <th>Detection</th>
              <th>Confidence</th>
              <th>Time</th>
              <th>Alert</th>
            </tr>
          </thead>
          <tbody>
            {aiData.map((row, idx) => (
              <tr key={idx} style={row.alert !== 'None' ? { background: '#ffeaea' } : {}}>
                <td>{row.droneId}</td>
                <td>{row.detection}</td>
                <td>{(row.confidence * 100).toFixed(1)}%</td>
                <td>{row.time}</td>
                <td style={row.alert !== 'None' ? { color: '#c00', fontWeight: 600 } : { color: '#090' }}>{row.alert}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 