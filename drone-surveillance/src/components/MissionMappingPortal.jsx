import React, { useState } from 'react';
import './SurveillanceMap.css';

// Demo drones and waypoints
const DEMO_DRONES = [
  { id: 1, name: 'Pinaak-01', lat: 28.6139, lng: 77.2090 },
  { id: 2, name: 'Akash-02', lat: 28.615, lng: 77.215 },
  { id: 3, name: 'Prithvi-03', lat: 28.617, lng: 77.212 },
];
const DEMO_WAYPOINTS = [
  { id: 1, lat: 28.6145, lng: 77.211, label: 'WP1' },
  { id: 2, lat: 28.616, lng: 77.213, label: 'WP2' },
];

export default function MissionMappingPortal() {
  const [drones] = useState(DEMO_DRONES);
  const [waypoints, setWaypoints] = useState(DEMO_WAYPOINTS);
  const [adding, setAdding] = useState(false);

  const handleMapClick = () => {
    if (!adding) return;
    // For demo, use random lat/lng near center
    const lat = 28.6139 + (Math.random() - 0.5) * 0.01;
    const lng = 77.2090 + (Math.random() - 0.5) * 0.01;
    setWaypoints(wps => [
      ...wps,
      { id: Date.now(), lat, lng, label: `WP${wps.length + 1}` }
    ]);
    setAdding(false);
  };

  const handleAddWaypoint = () => setAdding(true);

  return (
    <div className="dashboard-panel" style={{ minWidth: 400, maxWidth: 900, margin: '0 auto' }}>
      <h2>Mission Mapping Portal</h2>
      <p style={{ color: '#888', marginBottom: 12 }}>Plan missions, view live drone positions, and edit waypoints</p>
      <div style={{ position: 'relative', height: 400, background: '#e3f2fd', borderRadius: 16, marginBottom: 18, overflow: 'hidden', border: '1.5px solid #90caf9' }} onClick={handleMapClick}>
        {/* Demo 2D map grid */}
        <svg width="100%" height="100%" viewBox="0 0 800 400" style={{ position: 'absolute', top: 0, left: 0 }}>
          {/* Grid lines */}
          {[...Array(9)].map((_, i) => (
            <line key={i} x1={i*100} y1={0} x2={i*100} y2={400} stroke="#bbdefb" strokeWidth="1" />
          ))}
          {[...Array(5)].map((_, i) => (
            <line key={i} x1={0} y1={i*100} x2={800} y2={i*100} stroke="#bbdefb" strokeWidth="1" />
          ))}
          {/* Waypoints */}
          {waypoints.map(wp => (
            <circle key={wp.id} cx={400 + (wp.lng - 77.2090) * 8000} cy={200 - (wp.lat - 28.6139) * 40000} r={12} fill="#1976d2" />
          ))}
          {waypoints.map(wp => (
            <text key={wp.id + '-label'} x={400 + (wp.lng - 77.2090) * 8000 + 16} y={200 - (wp.lat - 28.6139) * 40000 + 6} fontSize={16} fill="#1976d2" fontWeight="bold">{wp.label}</text>
          ))}
          {/* Drones */}
          {drones.map(drone => (
            <rect key={drone.id} x={400 + (drone.lng - 77.2090) * 8000 - 10} y={200 - (drone.lat - 28.6139) * 40000 - 10} width={20} height={20} fill="#43a047" stroke="#222" strokeWidth={2} rx={5} />
          ))}
          {drones.map(drone => (
            <text key={drone.id + '-label'} x={400 + (drone.lng - 77.2090) * 8000 + 14} y={200 - (drone.lat - 28.6139) * 40000 + 6} fontSize={15} fill="#388e3c" fontWeight="bold">{drone.name}</text>
          ))}
        </svg>
        <div style={{ position: 'absolute', top: 12, right: 18, background: '#fff', color: '#1976d2', borderRadius: 8, padding: '6px 18px', fontWeight: 700, fontSize: 16, boxShadow: '0 2px 8px #1976d233' }}>
          {adding ? 'Click map to add waypoint' : 'Click "Add Waypoint" to plan'}
        </div>
      </div>
      <button onClick={handleAddWaypoint} disabled={adding} style={{ marginBottom: 18, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontWeight: 700, fontSize: 16, cursor: adding ? 'not-allowed' : 'pointer' }}>
        {adding ? 'Adding...' : 'Add Waypoint'}
      </button>
      <div style={{ marginTop: 18 }}>
        <h4 style={{ color: '#1976d2' }}>Waypoints</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {waypoints.map(wp => (
            <li key={wp.id} style={{ marginBottom: 8, background: '#e3f2fd', borderRadius: 6, padding: '8px 16px', color: '#1976d2', fontWeight: 600, fontSize: 15, boxShadow: '0 1px 4px #1976d211' }}>
              {wp.label}: ({wp.lat.toFixed(5)}, {wp.lng.toFixed(5)})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 