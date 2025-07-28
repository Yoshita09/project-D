import React, { useState, useEffect, useRef } from 'react';
import './SurveillanceMap.css';

const SurveillanceMap = () => {
  // Use state for drones so they can be updated
  const [drones, setDrones] = useState([
    { id: 1, name: 'Prithvi-1', x: 20, y: 30, type: 'Reconnaissance', battery: 85, status: 'Active' },
    { id: 2, name: 'Aakash-2', x: 60, y: 40, type: 'Combat', battery: 92, status: 'Active' },
    { id: 3, name: 'Pinaka-3', x: 40, y: 70, type: 'Surveillance', battery: 78, status: 'Active' },
    { id: 4, name: 'Pinaka-4', x: 80, y: 20, type: 'Heavy Combat', battery: 95, status: 'Active' },
    { id: 5, name: 'Aakash-5', x: 30, y: 80, type: 'Stealth', battery: 88, status: 'Active' },
    { id: 6, name: 'Prithvi-6', x: 70, y: 60, type: 'Multi-Role', battery: 82, status: 'Active' }
  ]);

  const [threats] = useState([
    { id: 1, x: 45, y: 35, type: 'Vehicle', severity: 'High', description: 'Unauthorized vehicle' },
    { id: 2, x: 75, y: 45, type: 'Personnel', severity: 'Medium', description: 'Suspicious activity' },
    { id: 3, x: 25, y: 65, type: 'Equipment', severity: 'Low', description: 'Unknown equipment' }
  ]);

  const [landmines] = useState([
    { id: 1, x: 35, y: 25, type: 'Anti-Tank', confidence: 95 },
    { id: 2, x: 65, y: 55, type: 'Anti-Personnel', confidence: 87 },
    { id: 3, x: 55, y: 75, type: 'Anti-Tank', confidence: 92 }
  ]);

  const [patrolRoutes] = useState([
    { id: 1, points: [[10, 20], [30, 40], [50, 30], [70, 50], [90, 40]], active: true },
    { id: 2, points: [[20, 80], [40, 60], [60, 80], [80, 60]], active: false }
  ]);

  const [selectedDrone, setSelectedDrone] = useState(null);
  const [mapMode, setMapMode] = useState('normal');
  const [zoom, setZoom] = useState(1);
  const mapRef = useRef(null);

  useEffect(() => {
    // Only animate drones if needed in demo mode
    const interval = setInterval(() => {
      // No-op for static demo
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getThreatColor = (severity) => {
    switch (severity) {
      case 'High': return '#ff4444';
      case 'Medium': return '#ffaa00';
      case 'Low': return '#4CAF50';
      default: return '#ffffff';
    }
  };

  const getDroneColor = (drone) => {
    if (drone.battery < 20) return '#ff4444';
    if (drone.battery < 50) return '#ffaa00';
    return '#00d4ff';
  };

  const handleDroneClick = (drone, e) => {
    e.stopPropagation(); // Prevent map click
    setSelectedDrone(drone);
  };

  const handleMapClick = (e) => {
    if (!selectedDrone || !mapRef.current) return;
    // Get bounding rect of map
    const rect = mapRef.current.getBoundingClientRect();
    // Calculate click position as percent of map
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // Update selected drone's position
    setDrones(ds => ds.map(d => d.id === selectedDrone.id ? { ...d, x, y } : d));
    // Do NOT deselect after move
  };

  return (
    <div className="surveillance-map-container">
      <div className="map-controls">
        <div className="control-group">
          <button 
            className={`control-btn ${mapMode === 'normal' ? 'active' : ''}`}
            onClick={() => setMapMode('normal')}
          >
            Normal
          </button>
          <button 
            className={`control-btn ${mapMode === 'thermal' ? 'active' : ''}`}
            onClick={() => setMapMode('thermal')}
          >
            Thermal
          </button>
          <button 
            className={`control-btn ${mapMode === 'night' ? 'active' : ''}`}
            onClick={() => setMapMode('night')}
          >
            Night Vision
          </button>
        </div>
        <div className="control-group">
          <button 
            className="control-btn"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          >
            Zoom Out
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button 
            className="control-btn"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          >
            Zoom In
          </button>
        </div>
      </div>
      <div className="map-content">
        <div 
          className={`surveillance-map ${mapMode}`}
          ref={mapRef}
          onClick={handleMapClick}
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Grid Lines */}
          <div className="map-grid">
            {Array.from({ length: 10 }, (_, i) => (
              <React.Fragment key={i}>
                <div 
                  className="grid-line horizontal"
                  style={{ top: `${i * 10}%` }}
                />
                <div 
                  className="grid-line vertical"
                  style={{ left: `${i * 10}%` }}
                />
              </React.Fragment>
            ))}
          </div>
          {/* Patrol Routes */}
          {patrolRoutes.map(route => (
            <div key={route.id} className={`patrol-route ${route.active ? 'active' : ''}`}>
              <svg className="route-line" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  points={route.points.map(([x, y]) => `${x},${y}`).join(' ')}
                  fill="none"
                  stroke={route.active ? "#00d4ff" : "#666666"}
                  strokeWidth="0.5"
                  strokeDasharray={route.active ? "none" : "2,2"}
                />
              </svg>
            </div>
          ))}
          {/* Landmines */}
          {landmines.map(mine => (
            <div
              key={mine.id}
              className="landmine-marker"
              style={{ left: `${mine.x}%`, top: `${mine.y}%` }}
              title={`${mine.type} - ${mine.confidence}% confidence`}
            >
              <div className="mine-icon">💣</div>
              <div className="mine-confidence">{mine.confidence}%</div>
            </div>
          ))}
          {/* Threats */}
          {threats.map(threat => (
            <div
              key={threat.id}
              className="threat-marker"
              style={{ 
                left: `${threat.x}%`, 
                top: `${threat.y}%`,
                borderColor: getThreatColor(threat.severity)
              }}
              title={`${threat.type} - ${threat.severity} - ${threat.description}`}
            >
              <div className="threat-icon">
                {threat.type === 'Vehicle' ? '🚗' : 
                 threat.type === 'Personnel' ? '👤' : '📦'}
              </div>
              <div className="threat-severity">{threat.severity}</div>
            </div>
          ))}
          {/* Drones */}
          {drones.map(drone => (
            <div
              key={drone.id}
              className={`drone-marker ${selectedDrone?.id === drone.id ? 'selected' : ''}`}
              style={{ 
                left: `${drone.x}%`, 
                top: `${drone.y}%`,
                borderColor: getDroneColor(drone)
              }}
              onClick={e => handleDroneClick(drone, e)}
              title={`${drone.name} - ${drone.type} - Battery: ${drone.battery.toFixed(1)}%`}
            >
              <div className="drone-icon">🛸</div>
              <div className="drone-name">{drone.name}</div>
              <div className="drone-battery" style={{ backgroundColor: getDroneColor(drone) }}>
                {drone.battery.toFixed(0)}%
              </div>
            </div>
          ))}
          {/* Sector Boundaries */}
          <div className="sector-boundaries">
            <div className="sector sector-a" title="Sector A - Primary Surveillance">
              <span className="sector-label">A</span>
            </div>
            <div className="sector sector-b" title="Sector B - High Threat Zone">
              <span className="sector-label">B</span>
            </div>
            <div className="sector sector-c" title="Sector C - Patrol Route">
              <span className="sector-label">C</span>
            </div>
            <div className="sector sector-d" title="Sector D - Restricted Area">
              <span className="sector-label">D</span>
            </div>
          </div>
        </div>
      </div>
      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-icon drone-icon">🛸</div>
          <span>Drones</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon threat-icon">🚗</div>
          <span>Threats</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon mine-icon">💣</div>
          <span>Landmines</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon route-icon">🛣️</div>
          <span>Patrol Routes</span>
        </div>
      </div>
      {/* Selected Drone Info */}
      {selectedDrone && (
        <div className="drone-info-panel">
          <h3>{selectedDrone.name}</h3>
          <div className="drone-info">
            <div className="info-item">
              <span className="info-label">Type:</span>
              <span className="info-value">{selectedDrone.type}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Battery:</span>
              <span className="info-value" style={{ color: getDroneColor(selectedDrone) }}>
                {selectedDrone.battery.toFixed(1)}%
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value">{selectedDrone.status}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Position:</span>
              <span className="info-value">
                X: {selectedDrone.x.toFixed(1)}%, Y: {selectedDrone.y.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveillanceMap; 