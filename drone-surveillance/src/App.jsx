import React, { useState, useCallback } from 'react'
import './App.css'
import DroneDashboard from './components/DroneDashboard'
import SurveillanceMap from './components/SurveillanceMap'
import ThermalView from './components/ThermalView'
import AlertPanel from './components/AlertPanel'
import DroneControls from './components/DroneControls'
import ControlPanel from './components/ControlPanel'
import VideoDetectionSimulator from './components/VideoDetectionSimulator'
import DefenseSystems from './components/DefenseSystems'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import AIDescriptionUpload from './components/AIDescriptionUpload'
import DroneWebSocketManager from './components/DroneWebSocketManager'
import AIOutputPortal from './components/AIOutputPortal';
import MissionMappingPortal from './components/MissionMappingPortal';
import SecurityPortal from './components/SecurityPortal';
import MissionHistoryPortal from './components/MissionHistoryPortal';
import FirmwareManagementPortal from './components/FirmwareManagementPortal';
import EmergencyControlsPortal from './components/EmergencyControlsPortal';
import IntegrationPortal from './components/IntegrationPortal';
import SwarmAISyncPortal from './components/SwarmAISyncPortal';
import IFFPortal from './components/IFFPortal';
import OTAManagementPortal from './components/OTAManagementPortal';
import MissionLogsPortal from './components/MissionLogsPortal';
import SimulationPortal from './components/SimulationPortal';
import SwarmVisualizerPortal from './components/SwarmVisualizerPortal';

// Default drone fleet for initial state
const defaultDrones = [
  {
    id: 1,
    name: 'Prithvi-1',
    type: 'Reconnaissance',
    battery: 85,
    altitude: 1200,
    maxAltitude: 2000,
    speed: 45,
    maxSpeed: 120,
    range: 30,
    isActive: true,
    isHeadDrone: true,
    jammingStatus: 'STANDBY',
    threatLevel: 'LOW',
    location: { lat: 28.6139, lng: 77.2090 },
  },
  {
    id: 2,
    name: 'Aakash-2',
    type: 'Combat',
    battery: 92,
    altitude: 800,
    maxAltitude: 1800,
    speed: 60,
    maxSpeed: 140,
    range: 25,
    isActive: true,
    isHeadDrone: false,
    jammingStatus: 'STANDBY',
    threatLevel: 'MEDIUM',
    location: { lat: 28.6145, lng: 77.2100 },
  },
  {
    id: 3,
    name: 'Pinaka-3',
    type: 'Surveillance',
    battery: 78,
    altitude: 1500,
    maxAltitude: 2200,
    speed: 35,
    maxSpeed: 100,
    range: 40,
    isActive: true,
    isHeadDrone: false,
    jammingStatus: 'STANDBY',
    threatLevel: 'LOW',
    location: { lat: 28.6150, lng: 77.2080 },
  },
];

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [alerts, setAlerts] = useState([])
  const [drones, setDrones] = useState(defaultDrones)
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
  const [detections, setDetections] = useState([])

  const selectedDrone = drones.find(d => d.id === selectedDroneId)

  const updateDrone = (id, update) => {
    setDrones(ds => ds.map(d => d.id === id ? { ...d, ...update } : d))
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

  // Handler for drone control from ControlPanel
  // Handler for map control (future expansion)
  // Simulate detection handlers

  const handleDetections = useCallback((newDetections) => {
    setDetections(prev => {
      if (
        prev.length === newDetections.length &&
        prev.every((d, i) => JSON.stringify(d) === JSON.stringify(newDetections[i]))
      ) {
        return prev;
      }
      return newDetections;
    });
  }, []);

  // Move mapThreats declaration before renderCurrentView
  const mapThreats = alerts
    .filter(alert => ['Threat', 'Intrusion', 'System', 'illegal', 'unauthorized'].includes(alert.type))
    .map((alert, i) => ({
      id: alert.id || i,
      x: 10 + (i * 20) % 80, // Demo: spread out
      y: 20 + (i * 30) % 60,
      type: alert.type === 'Threat' ? 'Vehicle' : alert.type === 'Intrusion' ? 'Personnel' : 'Equipment',
      severity: alert.severity || 'Medium',
      description: alert.description || '',
    }));

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DroneDashboard 
            drones={drones}
            setDrones={setDrones}
          alerts={alerts} 
            setAlerts={setAlerts}
          systemStatus={systemStatus}
            setSystemStatus={setSystemStatus}
        />
        )
      case 'map':
        return (
          <SurveillanceMap 
          drones={drones} 
            threats={mapThreats}
          landmines={landmines}
            detections={detections}
            airDefenses={[]}
            radars={[]}
            missiles={[]}
            onMapControl={() => {}}
        />
        )
      case 'thermal':
        return (
          <ThermalView 
          drones={drones}
            systemStatus={systemStatus}
            onAlert={() => {}}
        />
        )
      case 'alerts':
        return (
          <AlertPanel 
          alerts={alerts}
        />
        )
      case 'controls':
        return (
          <DroneControls 
          droneStatus={selectedDrone} 
            setDroneStatus={(update) => updateDrone(selectedDroneId, update)}
          systemStatus={systemStatus}
          onActivateJamming={activateJammingSystem}
          onDeactivateJamming={deactivateJammingSystem}
          onStart3DMapping={start3DMapping}
          onDetectLandmines={detectLandmines}
          onAnalyzeThreats={analyzeThreatLevel}
        />
        )
      case 'video':
        return (
          <VideoDetectionSimulator 
            onHumanCountChange={(count) => console.log('Human count:', count)}
            onDetections={handleDetections}
        />
        )
      case 'defense':
        return <DefenseSystems />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'ai-detection':
        return <AIDescriptionUpload />
      case 'ai-output':
        return <AIOutputPortal />
      case 'mission-mapping':
        return <MissionMappingPortal />
      case 'security':
        return <SecurityPortal />
      case 'mission-history':
        return <MissionHistoryPortal />
      case 'firmware-management':
        return <FirmwareManagementPortal />
      case 'emergency-controls':
        return <EmergencyControlsPortal />
      case 'integration':
        return <IntegrationPortal />
      case 'swarm-ai-sync':
        return <SwarmAISyncPortal />
      case 'iff':
        return <IFFPortal />
      case 'SwarmCoordination':
        return <SwarmCoordinationPortal />;
      case 'IFF':
        return <IFFPortal />;
      case 'OTA':
        return <OTAManagementPortal />;
      case 'MissionLogs':
        return <MissionLogsPortal />;
      case 'Simulation':
        return <SimulationPortal />;
      case 'SwarmVisualizer':
        return <SwarmVisualizerPortal />;
      default:
        return (
          <DroneDashboard 
            drones={drones}
            alerts={alerts}
            systemStatus={systemStatus}
            threatAnalysis={threatAnalysis}
            onDroneSelect={setSelectedDroneId}
            selectedDroneId={selectedDroneId}
          />
        )
    }
  }

  return (
    <div className="app">
<<<<<<< HEAD
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>🛸 Advanced Drone Surveillance System</h1>
        </div>
        <nav className="sidebar-nav">
=======
      <header className="header">
        <h1><span className="emoji"></span>Advanced Drone Surveillance System</h1>
        <h2>AI-Controlled Drones</h2>
        <nav className="nav">
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          <button 
            className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button 
            className={`nav-button ${currentView === 'map' ? 'active' : ''}`}
            onClick={() => setCurrentView('map')}
          >
            <span className="nav-icon">🗺️</span>
            Surveillance Map
          </button>
          <button 
            className={`nav-button ${currentView === 'thermal' ? 'active' : ''}`}
            onClick={() => setCurrentView('thermal')}
          >
            <span className="nav-icon">🔥</span>
            Thermal View
          </button>
          <button 
            className={`nav-button ${currentView === 'alerts' ? 'active' : ''}`}
            onClick={() => setCurrentView('alerts')}
          >
            <span className="nav-icon">🚨</span>
            Alerts
          </button>
          <button 
            className={`nav-button ${currentView === 'controls' ? 'active' : ''}`}
            onClick={() => setCurrentView('controls')}
          >
            <span className="nav-icon">🎮</span>
            Controls
          </button>
          <button 
            className={`nav-button ${currentView === 'video' ? 'active' : ''}`}
            onClick={() => setCurrentView('video')}
          >
            <span className="nav-icon">📹</span>
            Video Detection
          </button>
          <button 
            className={`nav-button ${currentView === 'defense' ? 'active' : ''}`}
            onClick={() => setCurrentView('defense')}
          >
            <span className="nav-icon">🛡️</span>
            Defense Systems
          </button>
          <button 
            className={`nav-button ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentView('analytics')}
          >
<<<<<<< HEAD
            📊 Analytics
=======
            <span className="nav-icon">📊</span>
            Analytics
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'ai-detection' ? 'active' : ''}`}
            onClick={() => setCurrentView('ai-detection')}
          >
<<<<<<< HEAD
            🤖 AI Detection
=======
            <span className="nav-icon">🤖</span>
            AI Detection
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'ai-output' ? 'active' : ''}`}
            onClick={() => setCurrentView('ai-output')}
          >
<<<<<<< HEAD
            🧠 AI Output
=======
            <span className="nav-icon">🧠</span>
            AI Output
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'mission-mapping' ? 'active' : ''}`}
            onClick={() => setCurrentView('mission-mapping')}
          >
<<<<<<< HEAD
            🗺️ Mission Mapping
=======
            <span className="nav-icon">🗺️</span>
            Mission Mapping
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'security' ? 'active' : ''}`}
            onClick={() => setCurrentView('security')}
          >
<<<<<<< HEAD
            🔒 Security
=======
            <span className="nav-icon">🔒</span>
            Security
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'mission-history' ? 'active' : ''}`}
            onClick={() => setCurrentView('mission-history')}
          >
<<<<<<< HEAD
            📜 Mission History
=======
            <span className="nav-icon">📜</span>
            Mission History
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'firmware-management' ? 'active' : ''}`}
            onClick={() => setCurrentView('firmware-management')}
          >
<<<<<<< HEAD
            🛠️ Firmware Management
=======
            <span className="nav-icon">🛠️</span>
            Firmware Management
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'emergency-controls' ? 'active' : ''}`}
            onClick={() => setCurrentView('emergency-controls')}
          >
<<<<<<< HEAD
            🚨 Emergency Controls
=======
            <span className="nav-icon">🚨</span>
            Emergency Controls
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'integration' ? 'active' : ''}`}
            onClick={() => setCurrentView('integration')}
          >
<<<<<<< HEAD
            🔗 Integration
=======
            <span className="nav-icon">🔗</span>
            Integration
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'swarm-ai-sync' ? 'active' : ''}`}
            onClick={() => setCurrentView('swarm-ai-sync')}
          >
<<<<<<< HEAD
            🧬 Swarm AI Sync
=======
            <span className="nav-icon">🧬</span>
            Swarm AI Sync
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
          <button 
            className={`nav-button ${currentView === 'iff' ? 'active' : ''}`}
            onClick={() => setCurrentView('iff')}
          >
<<<<<<< HEAD
            🆔 IFF
=======
            <span className="nav-icon">🆔</span>
            IFF
>>>>>>> ef738864ef64a52aa63efee6fe1169b5a7d731ae
          </button>
        </nav>
      </div>
      <main className="main-content">
        {renderCurrentView()}
      </main>
    </div>
  )
}

export default App