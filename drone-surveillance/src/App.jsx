import React, { useState } from 'react'
import './App.css'
import DroneDashboard from './components/DroneDashboard'
import SurveillanceMap from './components/SurveillanceMap'
import ThermalView from './components/ThermalView'
import AlertPanel from './components/AlertPanel'
import DroneControls from './components/DroneControls'
import ControlPanel from './components/ControlPanel'
import VideoDetectionSimulator from './components/VideoDetectionSimulator'

const initialDrones = [
  {
    id: 1,
    name: 'Alpha-1',
    type: 'Surveillance',
    battery: 85,
    altitude: 120,
    speed: 25,
    location: { lat: 28.6139, lng: 77.2090 },
    isActive: true,
    capabilities: ['HD Camera', 'Night Vision', 'GPS Tracking', '3D Mapping'],
    maxAltitude: 200,
    maxSpeed: 50,
    range: 15,
    payload: '4K Camera + 3D Scanner',
    isHeadDrone: true,
    isUltimateHead: true,
    threatLevel: 'LOW',
    jammingStatus: 'STANDBY'
  },
  {
    id: 2,
    name: 'Bravo-2',
    type: 'Thermal',
    battery: 92,
    altitude: 100,
    speed: 20,
    location: { lat: 28.6239, lng: 77.2190 },
    isActive: false,
    capabilities: ['Thermal Imaging', 'Heat Detection', 'Long Range', 'Landmine Detection'],
    maxAltitude: 150,
    maxSpeed: 40,
    range: 20,
    payload: 'Thermal Camera + Mine Detector',
    isHeadDrone: false,
    isUltimateHead: false,
    threatLevel: 'LOW',
    jammingStatus: 'STANDBY'
  },
  {
    id: 3,
    name: 'Charlie-3',
    type: 'Emergency Response',
    battery: 78,
    altitude: 80,
    speed: 35,
    location: { lat: 28.6339, lng: 77.2290 },
    isActive: true,
    capabilities: ['High Speed', 'Emergency Lights', 'Loudspeaker', 'Jamming System'],
    maxAltitude: 300,
    maxSpeed: 80,
    range: 25,
    payload: 'Emergency Kit + Jammer',
    isHeadDrone: false,
    isUltimateHead: false,
    threatLevel: 'MEDIUM',
    jammingStatus: 'ACTIVE'
  },
  {
    id: 4,
    name: 'Delta-4',
    type: 'Patrol',
    battery: 95,
    altitude: 150,
    speed: 30,
    location: { lat: 28.6439, lng: 77.2390 },
    isActive: true,
    capabilities: ['Auto Patrol', 'Obstacle Avoidance', 'Extended Battery', 'Threat Analysis'],
    maxAltitude: 250,
    maxSpeed: 45,
    range: 30,
    payload: 'Multi-Sensor Array + AI',
    isHeadDrone: false,
    isUltimateHead: false,
    threatLevel: 'LOW',
    jammingStatus: 'STANDBY'
  },
  {
    id: 5,
    name: 'Echo-5',
    type: 'Reconnaissance',
    battery: 88,
    altitude: 200,
    speed: 40,
    location: { lat: 28.6539, lng: 77.2490 },
    isActive: false,
    capabilities: ['Stealth Mode', 'High Altitude', 'Advanced Optics', '3D Terrain Mapping'],
    maxAltitude: 500,
    maxSpeed: 60,
    range: 40,
    payload: 'Zoom Camera + 3D Scanner',
    isHeadDrone: false,
    isUltimateHead: false,
    threatLevel: 'LOW',
    jammingStatus: 'STANDBY'
  },
  {
    id: 6,
    name: 'Foxtrot-6',
    type: 'Cargo',
    battery: 70,
    altitude: 60,
    speed: 15,
    location: { lat: 28.6639, lng: 77.2590 },
    isActive: false,
    capabilities: ['Heavy Lift', 'Cargo Bay', 'Stable Flight', 'Weapon System'],
    maxAltitude: 100,
    maxSpeed: 25,
    range: 10,
    payload: 'Cargo Container + Missiles',
    isHeadDrone: false,
    isUltimateHead: false,
    threatLevel: 'HIGH',
    jammingStatus: 'STANDBY'
  }
]

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [alerts, setAlerts] = useState([])
  const [drones, setDrones] = useState(initialDrones)
  const [selectedDroneId, setSelectedDroneId] = useState(1)
  const [systemStatus, setSystemStatus] = useState({
    weather: 'Clear',
    windSpeed: 12,
    visibility: 'Good',
    temperature: 24,
    humidity: 65,
    threatLevel: 'LOW',
    jammingActive: false,
    headDroneStatus: 'OPERATIONAL'
  })
  const [threatAnalysis, setThreatAnalysis] = useState({
    totalThreats: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    targetsIdentified: 0,
    destructionAuthorized: false
  })
  const [landmines, setLandmines] = useState([])
  const [threeDMap, setThreeDMap] = useState({
    isActive: false,
    coverage: 0,
    resolution: 'HIGH',
    lastUpdate: new Date().toLocaleTimeString()
  })
  const [detections, setDetections] = useState([])
  const [airDefenses, setAirDefenses] = useState([]);
  const [radars, setRadars] = useState([]);
  const [missiles, setMissiles] = useState([]);

  const selectedDrone = drones.find(d => d.id === selectedDroneId)

  const updateDrone = (id, update) => {
    setDrones(ds => ds.map(d => d.id === id ? { ...d, ...update } : d))
  }

  const addAlert = (alert) => {
    setAlerts(prev => [alert, ...prev.slice(0, 19)])
  }

  const getDroneStatusColor = (drone) => {
    if (!drone.isActive) return '#666'
    if (drone.battery < 20) return '#ff4444'
    if (drone.battery < 50) return '#ff8800'
    return '#4CAF50'
  }

  const getThreatLevelColor = (level) => {
    switch (level) {
      case 'HIGH': return '#ff4444'
      case 'MEDIUM': return '#ff8800'
      case 'LOW': return '#4CAF50'
      default: return '#666'
    }
  }

  const activateJammingSystem = () => {
    setSystemStatus(prev => ({ ...prev, jammingActive: true }))
    setDrones(prev => prev.map(drone => ({ ...drone, jammingStatus: 'ACTIVE' })))
    alert('🚫 JAMMING SYSTEM ACTIVATED!\n\n- All enemy communications blocked\n- GPS spoofing active\n- Radio frequency interference\n- Electronic warfare mode: ENGAGED')
  }

  const deactivateJammingSystem = () => {
    setSystemStatus(prev => ({ ...prev, jammingActive: false }))
    setDrones(prev => prev.map(drone => ({ ...drone, jammingStatus: 'STANDBY' })))
    alert('✅ JAMMING SYSTEM DEACTIVATED!\n\n- Communications restored\n- GPS systems operational\n- Normal operations resumed')
  }

  const start3DMapping = () => {
    setThreeDMap(prev => ({ 
      ...prev, 
      isActive: true, 
      coverage: 0,
      lastUpdate: new Date().toLocaleTimeString()
    }))
    alert('🗺️ 3D MAPPING INITIATED!\n\n- Terrain scanning active\n- Point cloud generation\n- Digital elevation mapping\n- Coverage: 0% (Building...)')
    
    // Simulate 3D mapping progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        alert('✅ 3D MAPPING COMPLETE!\n\n- Coverage: 100%\n- Resolution: HIGH\n- Terrain data processed\n- Ready for analysis')
      }
      setThreeDMap(prev => ({ ...prev, coverage: Math.min(progress, 100) }))
    }, 1000)
  }

  const detectLandmines = () => {
    const newLandmines = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      id: Date.now() + i,
      location: {
        lat: 28.6139 + (Math.random() - 0.5) * 0.02,
        lng: 77.2090 + (Math.random() - 0.5) * 0.02
      },
      type: Math.random() < 0.5 ? 'Anti-Tank' : 'Anti-Personnel',
      confidence: Math.floor(Math.random() * 30) + 70,
      timestamp: new Date().toLocaleTimeString()
    }))
    
    setLandmines(prev => [...prev, ...newLandmines])
    alert(`💣 LANDMINE DETECTION COMPLETE!\n\n- Found ${newLandmines.length} landmines\n- Types: ${newLandmines.map(m => m.type).join(', ')}\n- Average confidence: ${Math.floor(newLandmines.reduce((sum, m) => sum + m.confidence, 0) / newLandmines.length)}%\n- Marking on map...`)
  }

  const analyzeThreatLevel = () => {
    const threats = alerts.filter(alert => alert.type === 'illegal' || alert.type === 'unauthorized')
    const highPriority = threats.filter(t => t.severity === 'high').length
    const mediumPriority = threats.filter(t => t.severity === 'medium').length
    const lowPriority = threats.filter(t => t.severity === 'low').length
    
    const newThreatAnalysis = {
      totalThreats: threats.length,
      highPriority,
      mediumPriority,
      lowPriority,
      targetsIdentified: threats.length,
      destructionAuthorized: highPriority > 2
    }
    
    setThreatAnalysis(newThreatAnalysis)
    
    if (newThreatAnalysis.destructionAuthorized) {
      alert('🚨 DESTRUCTION AUTHORIZED!\n\n- High threat level detected\n- Multiple targets identified\n- Weapons systems: ARMED\n- Ready for target elimination')
    } else {
      alert(`📊 THREAT ANALYSIS COMPLETE!\n\n- Total threats: ${threats.length}\n- High priority: ${highPriority}\n- Medium priority: ${mediumPriority}\n- Low priority: ${lowPriority}\n- Destruction authorized: ${newThreatAnalysis.destructionAuthorized ? 'YES' : 'NO'}`)
    }
  }

  const destroyTarget = (targetId) => {
    alert('💥 TARGET DESTRUCTION INITIATED!\n\n- Missile systems: FIRED\n- Target locked and tracked\n- Impact in 3... 2... 1...\n- Target eliminated successfully')
    
    // Remove target from alerts
    setAlerts(prev => prev.filter(alert => alert.id !== targetId))
    
    // Update threat analysis
    setThreatAnalysis(prev => ({
      ...prev,
      totalThreats: Math.max(0, prev.totalThreats - 1),
      targetsIdentified: Math.max(0, prev.targetsIdentified - 1)
    }))
  }

  // Handler for drone control from ControlPanel
  const handleDroneControl = (droneId, update) => {
    setDrones(ds => ds.map(d => d.id === droneId ? { ...d, ...update } : d))
  }

  // Handler for map control (future expansion)
  const handleMapControl = (action, params) => {
    // Implement as needed
  }

  // Simulate detection handlers
  const detectAirDefense = () => {
    setAirDefenses(prev => [
      ...prev,
      { id: Date.now(), x: Math.random(), y: Math.random() }
    ]);
  };
  const detectRadar = () => {
    setRadars(prev => [
      ...prev,
      { id: Date.now(), x: Math.random(), y: Math.random() }
    ]);
  };
  const detectMissile = () => {
    setMissiles(prev => [
      ...prev,
      { id: Date.now(), x: Math.random(), y: Math.random() }
    ]);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DroneDashboard 
          droneStatus={selectedDrone} 
          alerts={alerts} 
          systemStatus={systemStatus}
          threatAnalysis={threatAnalysis}
          threeDMap={threeDMap}
          landmines={landmines}
          onDestroyTarget={destroyTarget}
          detections={detections}
        />
      case 'map':
        return <SurveillanceMap 
          droneStatus={selectedDrone} 
          onAlert={addAlert} 
          drones={drones} 
          systemStatus={systemStatus}
          landmines={landmines}
          threeDMap={threeDMap}
        />
      case 'thermal':
        return <ThermalView 
          onAlert={addAlert} 
          drones={drones}
          landmines={landmines}
        />
      case 'alerts':
        return <AlertPanel 
          alerts={alerts}
          onDestroyTarget={destroyTarget}
          threatAnalysis={threatAnalysis}
        />
      case 'controls':
        return <DroneControls 
          droneStatus={selectedDrone} 
          setDroneStatus={update => updateDrone(selectedDrone.id, update)} 
          systemStatus={systemStatus}
          onActivateJamming={activateJammingSystem}
          onDeactivateJamming={deactivateJammingSystem}
          onStart3DMapping={start3DMapping}
          onDetectLandmines={detectLandmines}
          onAnalyzeThreats={analyzeThreatLevel}
        />
      case 'control-panel':
        return <ControlPanel 
          drones={drones} 
          systemStatus={systemStatus} 
          onDroneControl={handleDroneControl} 
          onMapControl={handleMapControl} 
        />
      case 'video-simulation':
        return <VideoDetectionSimulator onDetections={setDetections} />
      default:
        return <DroneDashboard />
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Border Security Drone Surveillance</h1>
        <nav className="nav">
          <button 
            className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-button ${currentView === 'map' ? 'active' : ''}`}
            onClick={() => setCurrentView('map')}
          >
            Surveillance Map
          </button>
          <button 
            className={`nav-button ${currentView === 'thermal' ? 'active' : ''}`}
            onClick={() => setCurrentView('thermal')}
          >
            Thermal View
          </button>
          <button 
            className={`nav-button ${currentView === 'alerts' ? 'active' : ''}`}
            onClick={() => setCurrentView('alerts')}
          >
            Alerts
          </button>
          <button 
            className={`nav-button ${currentView === 'controls' ? 'active' : ''}`}
            onClick={() => setCurrentView('controls')}
          >
            Drone Controls
          </button>
          <button 
            className={`nav-button ${currentView === 'control-panel' ? 'active' : ''}`}
            onClick={() => setCurrentView('control-panel')}
          >
            Control Panel
          </button>
          <button 
            className={`nav-button ${currentView === 'video-simulation' ? 'active' : ''}`}
            onClick={() => setCurrentView('video-simulation')}
          >
            Video Simulation
          </button>
        </nav>
      </header>
      
      <main className="main-content">
        {renderCurrentView({
          airDefenses,
          radars,
          missiles,
          detectAirDefense,
          detectRadar,
          detectMissile,
        })}
      </main>
    </div>
  )
}

export default App
