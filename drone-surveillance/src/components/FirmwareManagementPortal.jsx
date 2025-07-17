import React, { useState } from 'react';
import './DroneDashboard.css';

const DEMO_FIRMWARE = [
  { id: 1, name: 'Pinaak-01', version: 'v1.2.3', status: 'Up to date' },
  { id: 2, name: 'Akash-02', version: 'v1.2.2', status: 'Update available' },
  { id: 3, name: 'Prithvi-03', version: 'v1.2.3', status: 'Up to date' },
  { id: 4, name: 'Arjun-04', version: 'v1.1.9', status: 'Update available' },
];

export default function FirmwareManagementPortal() {
  const [firmware, setFirmware] = useState(DEMO_FIRMWARE);

  const handleUpdate = (id) => {
    setFirmware(fw => fw.map(d => d.id === id ? { ...d, status: 'Updating...' } : d));
    setTimeout(() => {
      setFirmware(fw => fw.map(d => d.id === id ? { ...d, version: 'v1.2.3', status: 'Up to date' } : d));
    }, 1500);
  };

  const handleRollback = (id) => {
    setFirmware(fw => fw.map(d => d.id === id ? { ...d, status: 'Rolling back...' } : d));
    setTimeout(() => {
      setFirmware(fw => fw.map(d => d.id === id ? { ...d, version: 'v1.1.9', status: 'Rolled back' } : d));
    }, 1500);
  };

  return (
    <div className="dashboard-panel" style={{ minWidth: 400, maxWidth: 900, margin: '0 auto' }}>
      <h2>Firmware Management Portal</h2>
      <p style={{ color: '#888', marginBottom: 12 }}>View firmware status, update, and rollback per drone</p>
      <table className="dashboard-table" style={{ width: '100%', minWidth: 600 }}>
        <thead>
          <tr>
            <th>Drone</th>
            <th>Firmware Version</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {firmware.map(drone => (
            <tr key={drone.id}>
              <td>{drone.name}</td>
              <td>{drone.version}</td>
              <td style={{ color: drone.status === 'Up to date' ? '#4CAF50' : drone.status.includes('Update') ? '#ffaa00' : '#1976d2', fontWeight: 600 }}>{drone.status}</td>
              <td>
                {drone.status === 'Update available' && (
                  <button onClick={() => handleUpdate(drone.id)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, fontSize: 15, marginRight: 8, cursor: 'pointer' }}>Update</button>
                )}
                {drone.status === 'Up to date' && (
                  <button onClick={() => handleRollback(drone.id)} style={{ background: '#ffaa00', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Rollback</button>
                )}
                {(drone.status === 'Updating...' || drone.status === 'Rolling back...') && (
                  <span style={{ color: '#888', fontWeight: 600 }}>{drone.status}</span>
                )}
                {drone.status === 'Rolled back' && (
                  <button onClick={() => handleUpdate(drone.id)} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Update</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 