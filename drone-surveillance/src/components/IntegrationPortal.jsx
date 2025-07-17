import React, { useState } from 'react';
import './DroneDashboard.css';

const DEMO_SYSTEMS = [
  { id: 1, name: 'Defense HQ API', status: 'Connected' },
  { id: 2, name: 'Weather Service', status: 'Connected' },
  { id: 3, name: 'Satellite Feed', status: 'Disconnected' },
  { id: 4, name: 'AI Analytics Cloud', status: 'Connected' },
];

export default function IntegrationPortal() {
  const [systems, setSystems] = useState(DEMO_SYSTEMS);
  const [log, setLog] = useState([]);

  const handleTest = (id) => {
    setSystems(sys => sys.map(s => s.id === id ? { ...s, status: 'Testing...' } : s));
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setSystems(sys => sys.map(s => s.id === id ? { ...s, status: success ? 'Connected' : 'Disconnected' } : s));
      setLog(lg => [
        { time: new Date().toLocaleTimeString(), system: systems.find(s => s.id === id).name, result: success ? 'Success' : 'Failed' },
        ...lg.slice(0, 19)
      ]);
    }, 1200);
  };

  return (
    <div className="dashboard-panel" style={{ minWidth: 400, maxWidth: 900, margin: '0 auto' }}>
      <h2>Integration Portal</h2>
      <p style={{ color: '#888', marginBottom: 12 }}>External system/API connections and status</p>
      <table className="dashboard-table" style={{ width: '100%', minWidth: 600 }}>
        <thead>
          <tr>
            <th>System/API</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {systems.map(system => (
            <tr key={system.id}>
              <td>{system.name}</td>
              <td style={{ color: system.status === 'Connected' ? '#4CAF50' : system.status === 'Disconnected' ? '#ff4444' : '#ffaa00', fontWeight: 600 }}>{system.status}</td>
              <td>
                <button onClick={() => handleTest(system.id)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Test/Reconnect</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 28 }}>
        <h4 style={{ color: '#1976d2' }}>Integration Log</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {log.map((entry, idx) => (
            <li key={idx} style={{ marginBottom: 8, background: '#e3f2fd', borderRadius: 6, padding: '8px 16px', color: entry.result === 'Success' ? '#43a047' : '#d32f2f', fontWeight: 600, fontSize: 15, boxShadow: '0 1px 4px #1976d211' }}>
              [{entry.time}] {entry.system}: {entry.result}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 