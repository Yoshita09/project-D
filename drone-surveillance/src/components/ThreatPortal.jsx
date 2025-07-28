import React, { useState, useEffect, useRef, useCallback } from 'react';

const typeColor = {
  human: '#ff9800',
  helicopter: '#2196f3',
  landmine: '#e53935',
  vehicle: '#4caf50',
  weapon: '#f44336',
  drone: '#9c27b0',
  building: '#607d8b',
  unknown: '#795548'
};

const typeIcon = {
  human: '🧑',
  helicopter: '🚁',
  landmine: '💣',
  vehicle: '🚗',
  weapon: '⚔️',
  drone: '🚁',
  building: '🏢',
  unknown: '❓'
};

const threatLevels = {
  'Low': { color: '#4caf50', priority: 1 },
  'Medium': { color: '#ff9800', priority: 2 },
  'High': { color: '#f44336', priority: 3 },
  'Critical': { color: '#d32f2f', priority: 4 }
};

export default function ThreatPortal({ detections = [] }) {
  const [threats, setThreats] = useState(detections);
  const [filteredThreats, setFilteredThreats] = useState(detections);
  const [filterType, setFilterType] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // list, grid, map

  // Responsive state
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  // Refs
  const updateIntervalRef = useRef(null);
  const alertAudioRef = useRef(null);

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

  // Initialize with enhanced demo data
  useEffect(() => {
    if (detections.length === 0) {
      const demoThreats = [
        {
          id: 1,
          type: 'human',
          x: 0.25,
          y: 0.35,
          level: 'Medium',
          confidence: 0.87,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          description: 'Armed personnel detected',
          distance: 150,
          bearing: 45,
          status: 'Active'
        },
        {
          id: 2,
          type: 'vehicle',
          x: 0.65,
          y: 0.45,
          level: 'High',
          confidence: 0.92,
          timestamp: new Date(Date.now() - 180000).toISOString(),
          description: 'Suspicious vehicle movement',
          distance: 230,
          bearing: 120,
          status: 'Tracking'
        },
        {
          id: 3,
          type: 'landmine',
          x: 0.15,
          y: 0.75,
          level: 'Critical',
          confidence: 0.95,
          timestamp: new Date(Date.now() - 120000).toISOString(),
          description: 'Explosive device detected',
          distance: 85,
          bearing: 270,
          status: 'Confirmed'
        }
      ];
      setThreats(demoThreats);
    } else {
      setThreats(detections.map((det, i) => ({
        ...det,
        id: i + 1,
        level: det.level || 'Medium',
        confidence: det.confidence || 0.8,
        timestamp: det.timestamp || new Date().toISOString(),
        description: det.description || `${det.type} detected`,
        distance: det.distance || Math.floor(Math.random() * 500) + 50,
        bearing: det.bearing || Math.floor(Math.random() * 360),
        status: det.status || 'Active'
      })));
    }
  }, [detections]);

  // Real-time threat simulation
  useEffect(() => {
    if (autoRefresh) {
      updateIntervalRef.current = setInterval(() => {
        if (Math.random() > 0.8) {
          const threatTypes = Object.keys(typeIcon);
          const levels = Object.keys(threatLevels);
          const statuses = ['Active', 'Tracking', 'Confirmed', 'Neutralized'];

          const newThreat = {
            id: Date.now(),
            type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
            x: Math.random(),
            y: Math.random(),
            level: levels[Math.floor(Math.random() * levels.length)],
            confidence: Math.random() * 0.4 + 0.6,
            timestamp: new Date().toISOString(),
            description: `New ${threatTypes[Math.floor(Math.random() * threatTypes.length)]} threat detected`,
            distance: Math.floor(Math.random() * 500) + 50,
            bearing: Math.floor(Math.random() * 360),
            status: statuses[Math.floor(Math.random() * statuses.length)]
          };

          setThreats(prev => [newThreat, ...prev.slice(0, 19)]);

          // Play alert for high/critical threats
          if ((newThreat.level === 'High' || newThreat.level === 'Critical') && alertsEnabled && alertAudioRef.current) {
            alertAudioRef.current.play().catch(() => { });
          }
        }
      }, 5000);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [autoRefresh, alertsEnabled]);

  // Enhanced filtering and sorting
  useEffect(() => {
    let filtered = threats;

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter(threat => threat.type === filterType);
    }

    // Filter by level
    if (filterLevel !== 'All') {
      filtered = filtered.filter(threat => threat.level === filterLevel);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'timestamp') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortBy === 'confidence' || sortBy === 'distance') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (sortBy === 'level') {
        aVal = threatLevels[aVal].priority;
        bVal = threatLevels[bVal].priority;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredThreats(filtered);
  }, [threats, filterType, filterLevel, sortBy, sortOrder]);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return '#4caf50';
    if (confidence >= 0.7) return '#ff9800';
    if (confidence >= 0.5) return '#ff6600';
    return '#f44336';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': '#f44336',
      'Tracking': '#ff9800',
      'Confirmed': '#d32f2f',
      'Neutralized': '#4caf50'
    };
    return colors[status] || '#666';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return isMobile ? date.toLocaleTimeString() : date.toLocaleString();
  };

  const getGridColumns = () => {
    if (isMobile) return '1fr';
    if (isTablet) return '1fr 1fr';
    return 'repeat(auto-fit, minmax(300px, 1fr))';
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div style={{
      padding: isMobile ? '10px' : '20px',
      backgroundColor: '#0a0a1a',
      minHeight: '100vh',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Alert Audio */}
      <audio ref={alertAudioRef}>
        <source src="/threat-alert.mp3" type="audio/mpeg" />
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
            color: '#f44336',
            margin: '0 0 5px 0',
            fontSize: isMobile ? '20px' : '28px',
            textShadow: '0 0 10px #f4433640'
          }}>
            ⚠️ Threat Portal
          </h1>
          <div style={{
            color: '#00ff88',
            fontSize: isMobile ? '12px' : '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <span>🎯 {filteredThreats.length} threats</span>
            <span>🔴 {filteredThreats.filter(t => t.level === 'Critical').length} critical</span>
            <span>🟡 {filteredThreats.filter(t => t.level === 'High').length} high</span>
            <span>🔄 {autoRefresh ? 'Live' : 'Paused'}</span>
          </div>
        </div>

        {/* Controls */}
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
              backgroundColor: autoRefresh ? '#4caf50' : '#f44336',
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
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            style={{
              padding: isMobile ? '6px 10px' : '8px 12px',
              backgroundColor: alertsEnabled ? '#ff9800' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 'bold'
            }}
          >
            {alertsEnabled ? '🔊 Alerts' : '🔇 Muted'}
          </button>

          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{
              padding: isMobile ? '6px' : '8px',
              backgroundColor: '#2a2a4e',
              color: '#eee',
              border: '1px solid #444',
              borderRadius: '5px',
              fontSize: isMobile ? '10px' : '12px'
            }}
          >
            <option value="list">📋 List</option>
            <option value="grid">📊 Grid</option>
            <option value="map">🗺️ Map</option>
          </select>
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
            🔍 Filter by Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
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
            <option value="All">All Types</option>
            {Object.keys(typeIcon).map(type => (
              <option key={type} value={type}>
                {typeIcon[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
            ⚠️ Filter by Level
          </label>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
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
            <option value="All">All Levels</option>
            {Object.keys(threatLevels).map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
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
            <option value="timestamp">Time</option>
            <option value="level">Threat Level</option>
            <option value="confidence">Confidence</option>
            <option value="distance">Distance</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      {/* Threat Display */}
      {filteredThreats.length === 0 ? (
        <div style={{
          backgroundColor: '#16213e',
          padding: '40px',
          borderRadius: '12px',
          border: '2px solid #0f3460',
          textAlign: 'center',
          color: '#4caf50'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>No threats detected</div>
          <div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>
            All systems secure
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '12px',
              border: '2px solid #0f3460',
              overflow: 'hidden'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: isMobile ? '11px' : '13px'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f3460' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('type')}>
                        🎯 Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('level')}>
                        ⚠️ Level {sortBy === 'level' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('confidence')}>
                        📊 Confidence {sortBy === 'confidence' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      {!isMobile && (
                        <>
                          <th style={{ padding: '12px 8px', textAlign: 'left' }}>📍 Location</th>
                          <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('distance')}>
                            📏 Distance {sortBy === 'distance' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </th>
                          <th style={{ padding: '12px 8px', textAlign: 'left' }}>🔄 Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredThreats.map((threat, index) => (
                      <tr
                        key={threat.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#1a2650' : '#16213e',
                          borderBottom: '1px solid #0f3460',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => setSelectedThreat(threat)}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = '#2a3660'}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? '#1a2650' : '#16213e'}
                      >
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{ marginRight: '8px', fontSize: '16px' }}>
                            {typeIcon[threat.type]}
                          </span>
                          <span style={{ color: typeColor[threat.type], fontWeight: 'bold' }}>
                            {threat.type.charAt(0).toUpperCase() + threat.type.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{
                            color: threatLevels[threat.level].color,
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            backgroundColor: `${threatLevels[threat.level].color}20`,
                            fontSize: '10px'
                          }}>
                            {threat.level}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{
                            color: getConfidenceColor(threat.confidence),
                            fontWeight: 'bold'
                          }}>
                            {(threat.confidence * 100).toFixed(1)}%
                          </span>
                        </td>
                        {!isMobile && (
                          <>
                            <td style={{ padding: '10px 8px', fontSize: '11px', color: '#aaa' }}>
                              ({(threat.x * 100).toFixed(1)}, {(threat.y * 100).toFixed(1)})
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '11px', color: '#aaa' }}>
                              {threat.distance}m @ {threat.bearing}°
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{
                                color: getStatusColor(threat.status),
                                fontWeight: 'bold',
                                fontSize: '10px'
                              }}>
                                {threat.status}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'grid' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: getGridColumns(),
              gap: '15px'
            }}>
              {filteredThreats.map(threat => (
                <div
                  key={threat.id}
                  style={{
                    backgroundColor: '#16213e',
                    padding: '15px',
                    borderRadius: '12px',
                    border: `2px solid ${threatLevels[threat.level].color}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 15px ${threatLevels[threat.level].color}30`
                  }}
                  onClick={() => setSelectedThreat(threat)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontSize: '24px' }}>
                      {typeIcon[threat.type]}
                    </span>
                    <span style={{
                      color: threatLevels[threat.level].color,
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: `${threatLevels[threat.level].color}20`
                    }}>
                      {threat.level}
                    </span>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ color: typeColor[threat.type], fontWeight: 'bold', fontSize: '16px' }}>
                      {threat.type.charAt(0).toUpperCase() + threat.type.slice(1)}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '12px' }}>
                      {threat.description}
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.4' }}>
                    <div>Confidence: <span style={{ color: getConfidenceColor(threat.confidence), fontWeight: 'bold' }}>
                      {(threat.confidence * 100).toFixed(1)}%
                    </span></div>
                    <div>Location: ({(threat.x * 100).toFixed(1)}, {(threat.y * 100).toFixed(1)})</div>
                    <div>Distance: {threat.distance}m @ {threat.bearing}°</div>
                    <div>Status: <span style={{ color: getStatusColor(threat.status), fontWeight: 'bold' }}>
                      {threat.status}
                    </span></div>
                    <div>Time: {formatTime(threat.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Threat Detail Modal */}
      {selectedThreat && (
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
            border: `2px solid ${threatLevels[selectedThreat.level].color}`,
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80%',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h3 style={{ color: '#f44336', margin: 0 }}>
                {typeIcon[selectedThreat.type]} Threat Details
              </h3>
              <button
                onClick={() => setSelectedThreat(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ lineHeight: '1.6' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Type:</strong> {selectedThreat.type.charAt(0).toUpperCase() + selectedThreat.type.slice(1)}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Threat Level:</strong> <span style={{ color: threatLevels[selectedThreat.level].color }}>
                  {selectedThreat.level}
                </span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Confidence:</strong> <span style={{ color: getConfidenceColor(selectedThreat.confidence) }}>
                  {(selectedThreat.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Location:</strong> ({(selectedThreat.x * 100).toFixed(1)}, {(selectedThreat.y * 100).toFixed(1)})
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Distance:</strong> {selectedThreat.distance}m
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Bearing:</strong> {selectedThreat.bearing}°
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Status:</strong> <span style={{ color: getStatusColor(selectedThreat.status) }}>
                  {selectedThreat.status}
                </span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Detected:</strong> {formatTime(selectedThreat.timestamp)}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Description:</strong> {selectedThreat.description}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}