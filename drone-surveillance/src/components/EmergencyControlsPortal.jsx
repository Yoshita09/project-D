import React, { useState, useEffect, useRef, useCallback } from 'react';

const DEMO_DRONES = [
  { id: 1, name: 'Pinaak-01', status: 'Active', emergency: false, battery: 85, location: '28.6139, 77.2090', altitude: 150, signal: 95 },
  { id: 2, name: 'Akash-02', status: 'Active', emergency: false, battery: 72, location: '28.6129, 77.2080', altitude: 200, signal: 88 },
  { id: 3, name: 'Prithvi-03', status: 'Active', emergency: false, battery: 91, location: '28.6149, 77.2100', altitude: 180, signal: 92 },
  { id: 4, name: 'Arjun-04', status: 'Active', emergency: false, battery: 67, location: '28.6159, 77.2110', altitude: 220, signal: 85 },
  { id: 5, name: 'Vayu-05', status: 'Standby', emergency: false, battery: 95, location: '28.6169, 77.2120', altitude: 0, signal: 98 },
  { id: 6, name: 'Agni-06', status: 'Active', emergency: false, battery: 78, location: '28.6179, 77.2130', altitude: 160, signal: 90 },
];

export default function EmergencyControlsPortal() {
  const [drones, setDrones] = useState(DEMO_DRONES);
  const [log, setLog] = useState([]);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);

  // Responsive state
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  // Refs
  const updateIntervalRef = useRef(null);
  const emergencyAudioRef = useRef(null);

  // Enhanced responsive design handler
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      setScreenSize({ width: newWidth, height: newHeight });
      setIsMobile(newWidth < 768);
      setIsTablet(newWidth >= 768 && newWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Real-time drone status updates
  useEffect(() => {
    if (autoRefresh) {
      updateIntervalRef.current = setInterval(() => {
        setDrones(prev => prev.map(drone => ({
          ...drone,
          battery: Math.max(10, drone.battery - Math.random() * 0.5),
          signal: Math.max(70, Math.min(100, drone.signal + (Math.random() - 0.5) * 5)),
          altitude: drone.status === 'Active' ?
            Math.max(100, Math.min(300, drone.altitude + (Math.random() - 0.5) * 10)) :
            drone.altitude
        })));
      }, 3000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Emergency mode detection
  useEffect(() => {
    const hasEmergency = drones.some(drone => drone.emergency);
    setEmergencyMode(hasEmergency);

    if (hasEmergency && emergencyAudioRef.current) {
      // emergencyAudioRef.current.play().catch(() => {}); // Uncomment for audio alerts
    }
  }, [drones]);

  const handleAction = useCallback((id, action) => {
    const drone = drones.find(d => d.id === id);
    if (!drone) return;

    setDrones(ds => ds.map(d => d.id === id ? {
      ...d,
      emergency: action === 'Emergency Stop',
      status: action === 'Land' ? 'Landing' : action === 'Return-to-Home' ? 'Returning' : d.status,
      altitude: action === 'Land' ? 0 : action === 'Emergency Stop' ? 0 : d.altitude
    } : d));

    const logEntry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      drone: drone.name,
      action,
      severity: action === 'Emergency Stop' ? 'Critical' : action === 'Land' ? 'High' : 'Medium',
      operator: 'System Admin'
    };

    setLog(lg => [logEntry, ...lg.slice(0, 49)]);
    setConfirmAction(null);
  }, [drones]);

  const handleBulkAction = useCallback((action) => {
    const activeDrones = drones.filter(d => d.status === 'Active');
    activeDrones.forEach(drone => {
      handleAction(drone.id, action);
    });
  }, [drones, handleAction]);

  const getStatusColor = (status) => {
    const colors = {
      'Active': '#00aa44',
      'Standby': '#ffaa00',
      'Landing': '#ff6600',
      'Returning': '#0088cc',
      'Emergency': '#ff4444',
      'Offline': '#666666'
    };
    return colors[status] || '#666';
  };

  const getBatteryColor = (battery) => {
    if (battery > 70) return '#00aa44';
    if (battery > 40) return '#ffaa00';
    if (battery > 20) return '#ff6600';
    return '#ff4444';
  };

  const getSignalStrength = (signal) => {
    if (signal > 90) return '📶📶📶📶';
    if (signal > 70) return '📶📶📶';
    if (signal > 50) return '📶📶';
    return '📶';
  };

  const filteredDrones = drones
    .filter(drone => filterStatus === 'All' || drone.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'battery':
          return b.battery - a.battery;
        case 'status':
          return a.status.localeCompare(b.status);
        case 'signal':
          return b.signal - a.signal;
        default:
          return 0;
      }
    });

  const getGridColumns = () => {
    if (isMobile) return '1fr';
    if (isTablet) return '1fr 1fr';
    return 'repeat(auto-fit, minmax(350px, 1fr))';
  };

  return (
    <div style={{
      padding: isMobile ? '10px' : '20px',
      backgroundColor: emergencyMode ? '#1a0a0a' : '#0a0a1a',
      minHeight: '100vh',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Emergency Audio */}
      <audio ref={emergencyAudioRef} loop>
        <source src="/emergency-alert.mp3" type="audio/mpeg" />
      </audio>

      {/* Enhanced Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h1 style={{
            color: emergencyMode ? '#ff4444' : '#ff6600',
            margin: '0 0 5px 0',
            fontSize: isMobile ? '20px' : '28px',
            textShadow: emergencyMode ? '0 0 15px #ff444460' : '0 0 10px #ff660040',
            animation: emergencyMode ? 'blink 1s infinite' : 'none'
          }}>
            🚨 Emergency Controls Portal
          </h1>
          <div style={{
            color: '#00ff88',
            fontSize: isMobile ? '12px' : '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <span>🚁 {filteredDrones.length} drones</span>
            <span style={{ color: emergencyMode ? '#ff4444' : '#00aa44' }}>
              {emergencyMode ? '⚠️ EMERGENCY ACTIVE' : '✅ All Systems Normal'}
            </span>
            <span>🔄 {autoRefresh ? 'Live' : 'Paused'}</span>
          </div>
        </div>

        {/* Emergency Controls */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: isMobile ? '6px 10px' : '8px 12px',
              backgroundColor: autoRefresh ? '#00aa44' : '#aa4400',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 'bold'
            }}
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
          </button>

          <button
            onClick={() => setConfirmAction({ type: 'bulk', action: 'Return-to-Home' })}
            style={{
              padding: isMobile ? '6px 10px' : '8px 12px',
              backgroundColor: '#0088cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 'bold'
            }}
          >
            🏠 RTH All
          </button>

          <button
            onClick={() => setConfirmAction({ type: 'bulk', action: 'Emergency Stop' })}
            style={{
              padding: isMobile ? '6px 10px' : '8px 12px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 'bold',
              animation: emergencyMode ? 'pulse 1s infinite' : 'none'
            }}
          >
            🛑 STOP ALL
          </button>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
        backgroundColor: '#16213e',
        padding: '15px',
        borderRadius: '12px',
        border: '2px solid #0f3460'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
            🔍 Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a4e',
              color: '#eee',
              border: '1px solid #444',
              borderRadius: '5px',
              fontSize: '12px'
            }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Standby">Standby</option>
            <option value="Landing">Landing</option>
            <option value="Returning">Returning</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
            📈 Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2a4e',
              color: '#eee',
              border: '1px solid #444',
              borderRadius: '5px',
              fontSize: '12px'
            }}
          >
            <option value="name">Name</option>
            <option value="battery">Battery</option>
            <option value="status">Status</option>
            <option value="signal">Signal</option>
          </select>
        </div>
      </div>

      {/* Enhanced Drone Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: getGridColumns(),
        gap: '15px',
        marginBottom: '20px'
      }}>
        {filteredDrones.map(drone => (
          <div
            key={drone.id}
            style={{
              backgroundColor: drone.emergency ? '#2a1616' : '#16213e',
              padding: '15px',
              borderRadius: '12px',
              border: `2px solid ${drone.emergency ? '#ff4444' : getStatusColor(drone.status)}`,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: drone.emergency ? '0 0 20px #ff444460' : `0 4px 15px ${getStatusColor(drone.status)}30`,
              animation: drone.emergency ? 'pulse 2s infinite' : 'none'
            }}
            onClick={() => setSelectedDrone(selectedDrone === drone.id ? null : drone.id)}
          >
            {/* Drone Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <div style={{
                color: '#00aaff',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                🚁 {drone.name}
              </div>
              <div style={{
                color: getStatusColor(drone.status),
                fontWeight: 'bold',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: `${getStatusColor(drone.status)}20`
              }}>
                {drone.status}
              </div>
            </div>

            {/* Drone Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '15px',
              fontSize: '12px'
            }}>
              <div>
                <div style={{ color: '#aaa' }}>Battery</div>
                <div style={{ color: getBatteryColor(drone.battery), fontWeight: 'bold' }}>
                  🔋 {drone.battery.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ color: '#aaa' }}>Signal</div>
                <div style={{ color: '#00aaff', fontWeight: 'bold' }}>
                  {getSignalStrength(drone.signal)} {drone.signal.toFixed(0)}%
                </div>
              </div>
              <div>
                <div style={{ color: '#aaa' }}>Altitude</div>
                <div style={{ color: '#ffaa00', fontWeight: 'bold' }}>
                  ⬆️ {drone.altitude}m
                </div>
              </div>
              <div>
                <div style={{ color: '#aaa' }}>Emergency</div>
                <div style={{ color: drone.emergency ? '#ff4444' : '#00aa44', fontWeight: 'bold' }}>
                  {drone.emergency ? '🚨 ACTIVE' : '✅ Normal'}
                </div>
              </div>
            </div>

            {/* Emergency Actions */}
            {selectedDrone === drone.id && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                gap: '8px',
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid #444'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmAction({ type: 'single', droneId: drone.id, action: 'Return-to-Home' });
                  }}
                  style={{
                    padding: '8px',
                    backgroundColor: '#0088cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  🏠 RTH
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmAction({ type: 'single', droneId: drone.id, action: 'Land' });
                  }}
                  style={{
                    padding: '8px',
                    backgroundColor: '#00aa44',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  🛬 Land
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmAction({ type: 'single', droneId: drone.id, action: 'Emergency Stop' });
                  }}
                  style={{
                    padding: '8px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  🛑 STOP
                </button>
              </div>
            )}

            {/* Location Info */}
            <div style={{
              marginTop: '10px',
              fontSize: '11px',
              color: '#aaa'
            }}>
              📍 {drone.location}
            </div>
          </div>
        ))}
      </div>

      {/* Action Log */}
      <div style={{
        backgroundColor: '#16213e',
        padding: '15px',
        borderRadius: '12px',
        border: '2px solid #0f3460'
      }}>
        <h3 style={{ color: '#00d4ff', margin: '0 0 15px 0', fontSize: '16px' }}>
          📋 Emergency Action Log
        </h3>
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: '#0a1a2a',
          padding: '10px',
          borderRadius: '8px'
        }}>
          {log.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center' }}>No emergency actions recorded</div>
          ) : (
            log.map(entry => (
              <div
                key={entry.id}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #333',
                  fontSize: '12px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#00aaff', fontWeight: 'bold' }}>
                    {entry.drone}
                  </span>
                  <span style={{
                    color: entry.severity === 'Critical' ? '#ff4444' :
                      entry.severity === 'High' ? '#ff6600' : '#ffaa00',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    backgroundColor: `${entry.severity === 'Critical' ? '#ff4444' :
                      entry.severity === 'High' ? '#ff6600' : '#ffaa00'}20`
                  }}>
                    {entry.severity}
                  </span>
                </div>
                <div style={{ color: '#aaa', marginTop: '2px' }}>
                  {entry.action} at {entry.time} by {entry.operator}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#16213e',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #ff4444',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#ff4444', margin: '0 0 15px 0' }}>
              ⚠️ Confirm Emergency Action
            </h3>
            <p style={{ color: '#fff', marginBottom: '20px' }}>
              Are you sure you want to execute "{confirmAction.action}"
              {confirmAction.type === 'bulk' ? ' for all active drones' : ` for ${drones.find(d => d.id === confirmAction.droneId)?.name}`}?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmAction(null)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'bulk') {
                    handleBulkAction(confirmAction.action);
                  } else {
                    handleAction(confirmAction.droneId, confirmAction.action);
                  }
                }}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.5; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}