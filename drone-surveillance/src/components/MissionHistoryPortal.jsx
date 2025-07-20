import React, { useState } from 'react';
import './DroneDashboard.css';

const DEMO_MISSIONS = [
  {
    id: 1,
    name: 'Recon Sweep Prithvi',
    type: 'Reconnaissance',
    status: 'Completed',
    startTime: '2024-01-15 08:00',
    endTime: '2024-01-15 12:00',
    duration: '4h 00m',
    drones: ['Prithvi-1', 'Aakash-2'],
    successRate: 95,
    notes: 'Successfully mapped 3 sectors, identified 2 potential threats'
  },
  {
    id: 2,
    name: 'Rescue Op Aakash',
    type: 'Search & Rescue',
    status: 'Completed',
    startTime: '2024-01-14 14:30',
    endTime: '2024-01-14 18:45',
    duration: '4h 15m',
    drones: ['Pinaka-3', 'Agni-4', 'BrahMos-5'],
    successRate: 88,
    notes: 'Located missing personnel, provided medical supplies'
  },
];

export default function MissionHistoryPortal() {
  const [missions] = useState(DEMO_MISSIONS);
  const [selected, setSelected] = useState(null);

  return (
    <div className="dashboard-panel" style={{ minWidth: 400, maxWidth: 900, margin: '0 auto' }}>
      <h2>Mission History Portal</h2>
      <p style={{ color: '#888', marginBottom: 12 }}>View past missions, details, and replay telemetry/video</p>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Mission List */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <h4 style={{ color: '#1976d2' }}>Past Missions</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {missions.map(m => (
              <li key={m.id} style={{ marginBottom: 10, background: selected?.id === m.id ? '#e3f2fd' : '#f5f5f5', borderRadius: 6, padding: '10px 18px', color: '#1976d2', fontWeight: 600, fontSize: 15, boxShadow: '0 1px 4px #1976d211', cursor: 'pointer' }} onClick={() => setSelected(m)}>
                <span style={{ fontWeight: 700 }}>{m.name}</span> <span style={{ color: '#888', fontWeight: 400, fontSize: 13 }}>({m.date})</span>
                <span style={{ float: 'right', color: m.outcome === 'Success' ? '#4CAF50' : '#ffaa00', fontWeight: 700 }}>{m.outcome}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Mission Details */}
        <div style={{ flex: 2, minWidth: 320 }}>
          {selected ? (
            <div>
              <h4 style={{ color: '#1976d2', marginBottom: 8 }}>{selected.name} <span style={{ color: '#888', fontWeight: 400, fontSize: 15 }}>({selected.date})</span></h4>
              <div style={{ marginBottom: 8 }}><b>Drones:</b> {selected.drones.join(', ')}</div>
              <div style={{ marginBottom: 8 }}><b>Waypoints:</b> {selected.waypoints.map(wp => `${wp.lat.toFixed(5)},${wp.lng.toFixed(5)}`).join(' → ')}</div>
              <div style={{ marginBottom: 8 }}><b>Outcome:</b> <span style={{ color: selected.outcome === 'Success' ? '#4CAF50' : '#ffaa00', fontWeight: 700 }}>{selected.outcome}</span></div>
              <div style={{ marginBottom: 12 }}><b>Summary:</b> {selected.summary}</div>
              <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 16, marginBottom: 8, cursor: 'pointer' }}>Replay Telemetry</button>
              <button style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 16, marginLeft: 12, marginBottom: 8, cursor: 'pointer' }}>Replay Video</button>
              <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>(Replay is demo only. Integrate with backend for real data.)</div>
            </div>
          ) : (
            <div style={{ color: '#888', fontSize: 16, marginTop: 32 }}>Select a mission to view details and replay.</div>
          )}
        </div>
      </div>
    </div>
  );
} 