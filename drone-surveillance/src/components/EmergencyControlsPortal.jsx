import React, { useState } from 'react';
import './DroneDashboard.css';

const DEMO_DRONES = [
  { id: 1, name: 'Pinaak-01', status: 'Active', emergency: false },
  { id: 2, name: 'Akash-02', status: 'Active', emergency: false },
  { id: 3, name: 'Prithvi-03', status: 'Active', emergency: false },
  { id: 4, name: 'Arjun-04', status: 'Active', emergency: false },
];

export default function EmergencyControlsPortal() {
  const [drones, setDrones] = useState(DEMO_DRONES);
  const [log, setLog] = useState([]);

  const handleAction = (id, action) => {
    setDrones(ds => ds.map(d => d.id === id ? { ...d, emergency: action !== 'Return-to-Home' ? true : false } : d));
    setLog(lg => [
      { time: new Date().toLocaleTimeString(), drone: drones.find(d => d.id === id).name, action },
      ...lg.slice(0, 19)
    ]);
  };

  return (
    <div className="dashboard-panel" style={{ minWidth: 400, maxWidth: 900, margin: '0 auto' }}>
      <h2>Emergency Controls Portal</h2>
      <p style={{ color: '#888', marginBottom: 12 }}>Trigger critical actions for any drone in the fleet</p>
      <table className="dashboard-table" style={{ width: '100%', minWidth: 600 }}>
        <thead>
          <tr>
            <th>Drone</th>
            <th>Status</th>
            <th>Emergency</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drones.map(drone => (
            <tr key={drone.id}>
              <td>{drone.name}</td>
              <td>{drone.status}</td>
              <td style={{ color: drone.emergency ? '#ff4444' : '#4CAF50', fontWeight: 600 }}>{drone.emergency ? 'ACTIVE' : '—'}</td>
              <td>
                <button onClick={() => handleAction(drone.id, 'Return-to-Home')} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, fontSize: 15, marginRight: 8, cursor: 'pointer' }}>Return-to-Home</button>
                <button onClick={() => handleAction(drone.id, 'Land')} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, fontSize: 15, marginRight: 8, cursor: 'pointer' }}>Land</button>
                <button onClick={() => handleAction(drone.id, 'Emergency Stop')} style={{ background: '#ff4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Emergency Stop</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 28 }}>
        <h4 style={{ color: '#d32f2f' }}>Emergency Action Log</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {log.map((entry, idx) => (
            <li key={idx} style={{ marginBottom: 8, background: '#fff3e0', borderRadius: 6, padding: '8px 16px', color: '#d32f2f', fontWeight: 600, fontSize: 15, boxShadow: '0 1px 4px #d32f2f11' }}>
              [{entry.time}] {entry.drone}: {entry.action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 