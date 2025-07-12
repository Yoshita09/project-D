import { useState, useEffect, useRef } from 'react'
import droneVideo from '../assets/drone_video.mp4'
import VideoDetectionSimulator from './VideoDetectionSimulator'

const DroneSimulationPanel = () => {
  const detections = [
    { left: 120, top: 60, width: 80, height: 60, label: 'Person', color: '#00ff00' },
    { left: 250, top: 120, width: 100, height: 70, label: 'Vehicle', color: '#ff4444' }
  ]
  return (
    <div style={{ margin: '2rem auto', width: 480, position: 'relative', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
      <video
        src="/drone_video.mp4"
        width={480}
        height={270}
        autoPlay
        loop
        muted
        style={{ display: 'block', width: '100%', height: 'auto', background: '#222' }}
      />
      {detections.map((det, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: det.left,
          top: det.top,
          width: det.width,
          height: det.height,
          border: `2px solid ${det.color}`,
          borderRadius: 4,
          background: `${det.color}22`,
          color: det.color,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          fontSize: 14,
          pointerEvents: 'none',
          zIndex: 2
        }}>
          <span style={{ background: '#000c', color: '#fff', padding: '2px 6px', borderRadius: 4, margin: 2, fontSize: 12 }}>{det.label}</span>
        </div>
      ))}
    </div>
  )
}

const ControlPanel = ({ drones, systemStatus, onDroneControl, onMapControl }) => {
  const [selectedDrone, setSelectedDrone] = useState(drones[0])
  const [mapView, setMapView] = useState('satellite') // satellite, thermal, night, 3d
  const [controlMode, setControlMode] = useState('manual') // manual, auto, emergency
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 })
  const [cameraPosition, setCameraPosition] = useState({ pan: 0, tilt: 0, zoom: 1 })
  const [liveFeed, setLiveFeed] = useState(true)
  const [recording, setRecording] = useState(false)

  // 3D Mapping
  const [mappingActive, setMappingActive] = useState(false)
  const [mappingProgress, setMappingProgress] = useState(0)
  const [mappingStatus, setMappingStatus] = useState('Idle')

  // Landmine Detection
  const [landmines, setLandmines] = useState([])
  const [mineDetectionActive, setMineDetectionActive] = useState(false)

  // Jamming System
  const [jammingActive, setJammingActive] = useState(false)

  // Head Drone
  const [headDroneId, setHeadDroneId] = useState(drones.find(d => d.isHeadDrone)?.id || drones[0].id)

  // Threat Level Analysis
  const [threatLevel, setThreatLevel] = useState('LOW')
  const [threatSummary, setThreatSummary] = useState('No significant threats detected.')
  const [detectedHumans, setDetectedHumans] = useState(0)

  useEffect(() => {
    // Simulate live drone movement
    const interval = setInterval(() => {
      if (selectedDrone.isActive) {
        const newLocation = {
          lat: selectedDrone.location.lat + (Math.random() - 0.5) * 0.001,
          lng: selectedDrone.location.lng + (Math.random() - 0.5) * 0.001
        }
        onDroneControl(selectedDrone.id, { location: newLocation })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [selectedDrone, onDroneControl])

  // 3D Mapping simulation
  useEffect(() => {
    let interval
    if (mappingActive && mappingProgress < 100) {
      setMappingStatus('Mapping...')
      interval = setInterval(() => {
        setMappingProgress(prev => {
          const next = Math.min(prev + Math.random() * 10, 100)
          if (next === 100) setMappingStatus('Complete')
          return next
        })
      }, 800)
    }
    return () => clearInterval(interval)
  }, [mappingActive, mappingProgress])

  // Landmine detection simulation
  const handleMineDetection = () => {
    setMineDetectionActive(true)
    setTimeout(() => {
      const newMines = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
        id: Date.now() + i,
        type: Math.random() < 0.5 ? 'Anti-Tank' : 'Anti-Personnel',
        confidence: Math.floor(Math.random() * 30) + 70,
        location: {
          lat: selectedDrone.location.lat + (Math.random() - 0.5) * 0.01,
          lng: selectedDrone.location.lng + (Math.random() - 0.5) * 0.01
        }
      }))
      setLandmines(prev => [...prev, ...newMines])
      setMineDetectionActive(false)
    }, 2000)
  }

  // Jamming system toggle
  const handleJammingToggle = () => {
    setJammingActive(j => !j)
  }

  // Head drone switching
  const handleHeadDroneSwitch = (id) => {
    setHeadDroneId(id)
  }

  // Threat level analysis simulation
  const handleThreatAnalysis = () => {
    // Simulate based on number of detected humans, landmines, and jamming
    let level = 'LOW'
    let summary = 'No significant threats detected.'
    const mineCount = landmines.length
    if (mineCount > 2 || jammingActive || detectedHumans > 2) {
      level = 'MEDIUM'
      summary = 'Multiple landmines detected, jamming system active, or multiple humans detected.'
    }
    if (mineCount > 4 || detectedHumans > 5) {
      level = 'HIGH'
      summary = 'High number of landmines or humans detected! Immediate action required.'
    }
    setThreatLevel(level)
    setThreatSummary(summary)
  }

  const handleJoystickMove = (direction) => {
    const speed = 5
    let newX = joystickPosition.x
    let newY = joystickPosition.y

    switch (direction) {
      case 'up':
        newY = Math.max(-100, joystickPosition.y - speed)
        break
      case 'down':
        newY = Math.min(100, joystickPosition.y + speed)
        break
      case 'left':
        newX = Math.max(-100, joystickPosition.x - speed)
        break
      case 'right':
        newX = Math.min(100, joystickPosition.x + speed)
        break
      default:
        break
    }

    setJoystickPosition({ x: newX, y: newY })
    
    // Apply movement to drone
    if (selectedDrone.isActive) {
      const newLocation = {
        lat: selectedDrone.location.lat + (newY / 1000),
        lng: selectedDrone.location.lng + (newX / 1000)
      }
      onDroneControl(selectedDrone.id, { location: newLocation })
    }
  }

  const handleCameraControl = (axis, value) => {
    setCameraPosition(prev => ({
      ...prev,
      [axis]: Math.max(-100, Math.min(100, prev[axis] + value))
    }))
  }

  const handleDroneAction = (action) => {
    switch (action) {
      case 'takeoff':
        onDroneControl(selectedDrone.id, { isActive: true, altitude: 50 })
        break
      case 'land':
        onDroneControl(selectedDrone.id, { isActive: false, altitude: 0 })
        break
      case 'emergency':
        onDroneControl(selectedDrone.id, { isActive: false, altitude: 0, speed: 0 })
        break
      case 'patrol':
        setControlMode('auto')
        break
      case 'manual':
        setControlMode('manual')
        break
      default:
        break
    }
  }

  const getMapStyle = () => {
    switch (mapView) {
      case 'thermal':
        return { filter: 'hue-rotate(180deg) saturate(2)' }
      case 'night':
        return { filter: 'brightness(0.3) contrast(1.5)' }
      case '3d':
        return { filter: 'contrast(1.2) saturate(1.5)' }
      default:
        return {}
    }
  }

  return (
    <div className="control-panel" style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
      {/* Left Panel - Drone Selection & Status */}
      <div className="left-panel" style={{ flex: 1, minWidth: 250 }}>
        <div className="drone-selector-panel">
          <h3>🛸 Drone Fleet</h3>
          <div className="drone-list">
            {drones.map(drone => (
              <div 
                key={drone.id}
                className={`drone-item ${selectedDrone.id === drone.id ? 'selected' : ''}`}
                onClick={() => setSelectedDrone(drone)}
              >
                <div className="drone-header">
                  <span className="drone-name">{drone.name}</span>
                  {drone.isHeadDrone && <span className="crown">👑</span>}
                  <span className={`status-indicator ${drone.isActive ? 'active' : 'inactive'}`}>
                    {drone.isActive ? '🟢' : '🔴'}
                  </span>
                </div>
                <div className="drone-details">
                  <span className="drone-type">{drone.type}</span>
                  <span className="drone-battery">{drone.battery}%</span>
                </div>
                <div className="drone-specs">
                  <span>Alt: {drone.altitude}m</span>
                  <span>Speed: {drone.speed} km/h</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="selected-drone-status">
          <h3>📊 {selectedDrone.name} Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Battery:</span>
              <div className="battery-bar">
                <div 
                  className="battery-fill" 
                  style={{ 
                    width: `${selectedDrone.battery}%`,
                    backgroundColor: selectedDrone.battery < 20 ? '#ff4444' : selectedDrone.battery < 50 ? '#ff8800' : '#4CAF50'
                  }}
                ></div>
              </div>
              <span className="value">{selectedDrone.battery}%</span>
            </div>
            <div className="status-item">
              <span className="label">Altitude:</span>
              <span className="value">{selectedDrone.altitude}m / {selectedDrone.maxAltitude}m</span>
            </div>
            <div className="status-item">
              <span className="label">Speed:</span>
              <span className="value">{selectedDrone.speed} km/h / {selectedDrone.maxSpeed} km/h</span>
            </div>
            <div className="status-item">
              <span className="label">Range:</span>
              <span className="value">{selectedDrone.range} km</span>
            </div>
            <div className="status-item">
              <span className="label">Threat Level:</span>
              <span className="value" style={{ color: selectedDrone.threatLevel === 'HIGH' ? '#ff4444' : '#4CAF50' }}>
                {selectedDrone.threatLevel}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Jamming:</span>
              <span className="value">{selectedDrone.jammingStatus}</span>
            </div>
          </div>
        </div>

        {/* Real Drone Simulation Section */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h3>🛸 Real Drone Simulation (Live Video & Detection)</h3>
          <DroneSimulationPanel />
          <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
            (Video from public link. Overlay boxes simulate detection. Replace video URL for your own feed.)
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <h3>🚁 Head Drone System</h3>
          <div>
            <span>Current Head Drone: </span>
            <select value={headDroneId} onChange={e => handleHeadDroneSwitch(Number(e.target.value))}>
              {drones.map(drone => (
                <option key={drone.id} value={drone.id}>{drone.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Center Panel - Controls & Features */}
      <div className="center-panel" style={{ flex: 2, padding: '1rem', minWidth: 350 }}>
        {/* 3D Mapping */}
        <div style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>🗺️ 3-D Image Mapping</h3>
          <button onClick={() => { setMappingActive(true); setMappingProgress(0); }} disabled={mappingActive && mappingProgress < 100}>
            {mappingActive && mappingProgress < 100 ? 'Mapping...' : 'Start 3D Mapping'}
          </button>
          <div style={{ marginTop: 8 }}>
            <div style={{ background: '#eee', borderRadius: 4, height: 18, width: 200, overflow: 'hidden' }}>
              <div style={{ background: '#1976d2', width: `${mappingProgress}%`, height: '100%' }}></div>
            </div>
            <span style={{ marginLeft: 8 }}>{mappingStatus} ({Math.round(mappingProgress)}%)</span>
          </div>
        </div>
        {/* Landmine Detection */}
        <div style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>💣 Landmine Detection</h3>
          <button onClick={handleMineDetection} disabled={mineDetectionActive}>
            {mineDetectionActive ? 'Detecting...' : 'Detect Landmines'}
          </button>
          <ul style={{ marginTop: 8 }}>
            {landmines.map(mine => (
              <li key={mine.id}>
                {mine.type} (Confidence: {mine.confidence}%) @ [{mine.location.lat.toFixed(5)}, {mine.location.lng.toFixed(5)}]
              </li>
            ))}
            {landmines.length === 0 && <li>No landmines detected yet.</li>}
          </ul>
        </div>
        {/* Jamming System */}
        <div style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>🚫 Jamming System</h3>
          <button onClick={handleJammingToggle} style={{ background: jammingActive ? '#ff4444' : '#4CAF50', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: 4, padding: '6px 16px' }}>
            {jammingActive ? 'Deactivate Jamming' : 'Activate Jamming'}
          </button>
          <div style={{ marginTop: 8 }}>
            Status: <span style={{ color: jammingActive ? '#ff4444' : '#4CAF50', fontWeight: 'bold' }}>{jammingActive ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
        </div>
        {/* Threat Level Analysis */}
        <div style={{ marginBottom: 24, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
          <h3>⚠️ Threat Level Analysis</h3>
          <button onClick={handleThreatAnalysis}>Analyze Threats</button>
          <div style={{ marginTop: 8 }}>
            Threat Level: <span style={{ color: threatLevel === 'HIGH' ? '#ff4444' : threatLevel === 'MEDIUM' ? '#ff8800' : '#4CAF50', fontWeight: 'bold' }}>{threatLevel}</span>
            <div style={{ marginTop: 4 }}>{threatSummary}</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Video Detection */}
      <div className="right-panel" style={{ flex: 2, padding: '1rem', minWidth: 320, maxWidth: '100%' }}>
        <h3>🎥 Video Detection</h3>
        <div style={{fontSize:13, color:'#888', marginBottom:8}}>
          Real-time detection overlays: <b>tanks, soldiers, radars, aircraft, humans, landmines, helicopters, missiles</b>.<br/>
          Use the toggles above the video to simulate each type. Responsive for all devices.
        </div>
        <VideoDetectionSimulator onHumanCountChange={setDetectedHumans} />
      </div>
    </div>
  )
}

export default ControlPanel 