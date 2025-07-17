import React, { useState, useEffect } from 'react';

const DefenseSystems = () => {
  const [airDefenseStatus, setAirDefenseStatus] = useState({
    active: false,
    coverage: 85,
    targets: 0,
    missiles: 12,
    range: 50,
    accuracy: 92
  });

  const [radarStatus, setRadarStatus] = useState({
    active: false,
    range: 200,
    targets: 0,
    frequency: 'X-Band',
    power: 85,
    interference: 0
  });

  const [missileStatus, setMissileStatus] = useState({
    ready: 8,
    locked: 0,
    fired: 0,
    accuracy: 94,
    range: 150,
    speed: 2500
  });

  const [jammingStatus, setJammingStatus] = useState({
    active: false,
    power: 0,
    frequency: 'Multi-Band',
    range: 100,
    effectiveness: 0
  });

  const [threats, setThreats] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);

  useEffect(() => {
    // Simulate threat detection
    const threatInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        const newThreat = {
          id: Date.now(),
          type: ['Aircraft', 'Missile', 'Drone', 'Vehicle'][Math.floor(Math.random() * 4)],
          distance: Math.floor(Math.random() * 200) + 50,
          speed: Math.floor(Math.random() * 500) + 100,
          threat: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
          timestamp: new Date().toLocaleTimeString()
        };
        setThreats(prev => [...prev, newThreat].slice(-10));
        addLog(`Threat detected: ${newThreat.type} at ${newThreat.distance}km`);
      }
    }, 3000);

    return () => clearInterval(threatInterval);
  }, []);

  const addLog = (message) => {
    setSystemLogs(prev => [...prev, {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString(),
      type: 'info'
    }].slice(-20));
  };

  const activateAirDefense = () => {
    setAirDefenseStatus(prev => ({ ...prev, active: !prev.active }));
    addLog(`Air Defense System ${!airDefenseStatus.active ? 'ACTIVATED' : 'DEACTIVATED'}`);
  };

  const activateRadar = () => {
    setRadarStatus(prev => ({ ...prev, active: !prev.active }));
    addLog(`Radar System ${!radarStatus.active ? 'ACTIVATED' : 'DEACTIVATED'}`);
  };

  const fireMissile = (targetId) => {
    if (missileStatus.ready > 0) {
      setMissileStatus(prev => ({
        ...prev,
        ready: prev.ready - 1,
        fired: prev.fired + 1
      }));
      setThreats(prev => prev.filter(t => t.id !== targetId));
      addLog(`Missile fired at target ${targetId}`);
    }
  };

  const activateJamming = () => {
    setJammingStatus(prev => ({ ...prev, active: !prev.active }));
    addLog(`Jamming System ${!jammingStatus.active ? 'ACTIVATED' : 'DEACTIVATED'}`);
  };

  const updateJammingPower = (power) => {
    setJammingStatus(prev => ({ ...prev, power, effectiveness: power * 0.8 }));
  };

  return (
    <div className="defense-systems">
      <div className="systems-header">
        <h2>🛡️ Defense Systems Control</h2>
        <div className="system-overview">
          <div className="overview-item">
            <span className="label">Air Defense:</span>
            <span className={`status ${airDefenseStatus.active ? 'active' : 'inactive'}`}>
              {airDefenseStatus.active ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <div className="overview-item">
            <span className="label">Radar:</span>
            <span className={`status ${radarStatus.active ? 'active' : 'inactive'}`}>
              {radarStatus.active ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <div className="overview-item">
            <span className="label">Jamming:</span>
            <span className={`status ${jammingStatus.active ? 'active' : 'inactive'}`}>
              {jammingStatus.active ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      <div className="systems-grid">
        {/* Air Defense System */}
        <div className="system-panel air-defense">
          <h3>🚀 Air Defense System</h3>
          <div className="system-status">
            <div className="status-item">
              <span>Status:</span>
              <span className={airDefenseStatus.active ? 'active' : 'inactive'}>
                {airDefenseStatus.active ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <div className="status-item">
              <span>Coverage:</span>
              <span>{airDefenseStatus.coverage}%</span>
            </div>
            <div className="status-item">
              <span>Targets:</span>
              <span>{airDefenseStatus.targets}</span>
            </div>
            <div className="status-item">
              <span>Missiles:</span>
              <span>{airDefenseStatus.missiles}</span>
            </div>
            <div className="status-item">
              <span>Range:</span>
              <span>{airDefenseStatus.range}km</span>
            </div>
            <div className="status-item">
              <span>Accuracy:</span>
              <span>{airDefenseStatus.accuracy}%</span>
            </div>
          </div>
          <button 
            className={`control-btn ${airDefenseStatus.active ? 'active' : ''}`}
            onClick={activateAirDefense}
          >
            {airDefenseStatus.active ? 'DEACTIVATE' : 'ACTIVATE'} AIR DEFENSE
          </button>
        </div>

        {/* Radar System */}
        <div className="system-panel radar">
          <h3>📡 Radar System</h3>
          <div className="system-status">
            <div className="status-item">
              <span>Status:</span>
              <span className={radarStatus.active ? 'active' : 'inactive'}>
                {radarStatus.active ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <div className="status-item">
              <span>Range:</span>
              <span>{radarStatus.range}km</span>
            </div>
            <div className="status-item">
              <span>Targets:</span>
              <span>{radarStatus.targets}</span>
            </div>
            <div className="status-item">
              <span>Frequency:</span>
              <span>{radarStatus.frequency}</span>
            </div>
            <div className="status-item">
              <span>Power:</span>
              <span>{radarStatus.power}%</span>
            </div>
            <div className="status-item">
              <span>Interference:</span>
              <span>{radarStatus.interference}%</span>
            </div>
          </div>
          <button 
            className={`control-btn ${radarStatus.active ? 'active' : ''}`}
            onClick={activateRadar}
          >
            {radarStatus.active ? 'DEACTIVATE' : 'ACTIVATE'} RADAR
          </button>
        </div>

        {/* Missile System */}
        <div className="system-panel missile">
          <h3>💥 Missile System</h3>
          <div className="system-status">
            <div className="status-item">
              <span>Ready:</span>
              <span>{missileStatus.ready}</span>
            </div>
            <div className="status-item">
              <span>Locked:</span>
              <span>{missileStatus.locked}</span>
            </div>
            <div className="status-item">
              <span>Fired:</span>
              <span>{missileStatus.fired}</span>
            </div>
            <div className="status-item">
              <span>Accuracy:</span>
              <span>{missileStatus.accuracy}%</span>
            </div>
            <div className="status-item">
              <span>Range:</span>
              <span>{missileStatus.range}km</span>
            </div>
            <div className="status-item">
              <span>Speed:</span>
              <span>{missileStatus.speed} km/h</span>
            </div>
          </div>
          <div className="missile-controls">
            <button className="control-btn" disabled={missileStatus.ready === 0}>
              RELOAD MISSILES
            </button>
            <button className="control-btn" disabled={missileStatus.locked === 0}>
              FIRE LOCKED
            </button>
          </div>
        </div>

        {/* Jamming System */}
        <div className="system-panel jamming">
          <h3>🚫 Jamming System</h3>
          <div className="system-status">
            <div className="status-item">
              <span>Status:</span>
              <span className={jammingStatus.active ? 'active' : 'inactive'}>
                {jammingStatus.active ? 'ACTIVE' : 'STANDBY'}
              </span>
            </div>
            <div className="status-item">
              <span>Power:</span>
              <span>{jammingStatus.power}%</span>
            </div>
            <div className="status-item">
              <span>Frequency:</span>
              <span>{jammingStatus.frequency}</span>
            </div>
            <div className="status-item">
              <span>Range:</span>
              <span>{jammingStatus.range}km</span>
            </div>
            <div className="status-item">
              <span>Effectiveness:</span>
              <span>{jammingStatus.effectiveness}%</span>
            </div>
          </div>
          <div className="jamming-controls">
            <button 
              className={`control-btn ${jammingStatus.active ? 'active' : ''}`}
              onClick={activateJamming}
            >
              {jammingStatus.active ? 'DEACTIVATE' : 'ACTIVATE'} JAMMING
            </button>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={jammingStatus.power}
              onChange={(e) => updateJammingPower(Number(e.target.value))}
              className="power-slider"
            />
          </div>
        </div>
      </div>

      {/* Threat Display */}
      <div className="threats-section">
        <h3>🎯 Active Threats</h3>
        <div className="threats-list">
          {threats.map(threat => (
            <div key={threat.id} className={`threat-item ${threat.threat.toLowerCase()}`}>
              <div className="threat-info">
                <span className="threat-type">{threat.type}</span>
                <span className="threat-distance">{threat.distance}km</span>
                <span className="threat-speed">{threat.speed} km/h</span>
                <span className={`threat-level ${threat.threat.toLowerCase()}`}>
                  {threat.threat}
                </span>
              </div>
              <div className="threat-actions">
                <button 
                  className="action-btn track"
                  onClick={() => addLog(`Tracking ${threat.type}`)}
                >
                  TRACK
                </button>
                <button 
                  className="action-btn lock"
                  onClick={() => {
                    setMissileStatus(prev => ({ ...prev, locked: prev.locked + 1 }));
                    addLog(`Locked on ${threat.type}`);
                  }}
                >
                  LOCK
                </button>
                <button 
                  className="action-btn fire"
                  onClick={() => fireMissile(threat.id)}
                  disabled={missileStatus.ready === 0}
                >
                  FIRE
                </button>
              </div>
            </div>
          ))}
          {threats.length === 0 && (
            <div className="no-threats">No active threats detected</div>
          )}
        </div>
      </div>

      {/* System Logs */}
      <div className="logs-section">
        <h3>📋 System Logs</h3>
        <div className="logs-list">
          {systemLogs.map(log => (
            <div key={log.id} className="log-entry">
              <span className="log-time">{log.timestamp}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DefenseSystems; 