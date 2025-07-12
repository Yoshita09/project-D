import { useState, useEffect } from 'react'

const ThermalView = ({ onAlert, drones }) => {
  const [thermalData, setThermalData] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [thermalMode, setThermalMode] = useState('standard') // standard, enhanced, night
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    // Initialize thermal zones
    const zones = generateThermalZones()
    setThermalData(zones)

    // Simulate thermal activity
    const thermalInterval = setInterval(() => {
      if (Math.random() < 0.4) { // 40% chance of thermal activity
        const newActivity = generateThermalActivity()
        setThermalData(prev => [...prev, newActivity])
        
        // Generate alert for significant thermal activity
        if (newActivity.intensity > 70) {
          onAlert({
            type: 'thermal',
            message: `High-intensity thermal signature detected: ${newActivity.intensity.toFixed(1)}°C`,
            timestamp: new Date().toLocaleTimeString(),
            location: `${newActivity.x.toFixed(1)}, ${newActivity.y.toFixed(1)}`,
            intensity: newActivity.intensity
          })
        }
      }
    }, 3000)

    return () => clearInterval(thermalInterval)
  }, [onAlert])

  const generateThermalZones = () => {
    const zones = []
    const numZones = 15
    
    for (let i = 0; i < numZones; i++) {
      zones.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        temperature: Math.random() * 30 + 10, // 10-40°C
        type: Math.random() < 0.3 ? 'vehicle' : Math.random() < 0.5 ? 'human' : 'environmental',
        intensity: Math.random() * 100,
        timestamp: new Date().toLocaleTimeString()
      })
    }
    
    return zones
  }

  const generateThermalActivity = () => {
    const types = ['human', 'vehicle', 'fire', 'machinery']
    const type = types[Math.floor(Math.random() * types.length)]
    
    let baseTemp = 20
    switch (type) {
      case 'human': baseTemp = 37; break
      case 'vehicle': baseTemp = 45; break
      case 'fire': baseTemp = 80; break
      case 'machinery': baseTemp = 35; break
      default: baseTemp = 25
    }
    
    return {
      id: Date.now(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      temperature: baseTemp + (Math.random() - 0.5) * 20,
      type,
      intensity: Math.random() * 100,
      timestamp: new Date().toLocaleTimeString()
    }
  }

  const getThermalColor = (temperature) => {
    if (temperature < 15) return '#0000ff' // Blue - cold
    if (temperature < 25) return '#00ffff' // Cyan - cool
    if (temperature < 35) return '#00ff00' // Green - normal
    if (temperature < 45) return '#ffff00' // Yellow - warm
    if (temperature < 60) return '#ff8000' // Orange - hot
    return '#ff0000' // Red - very hot
  }

  const getThermalIcon = (type) => {
    switch (type) {
      case 'human': return '👤'
      case 'vehicle': return '🚗'
      case 'fire': return '🔥'
      case 'machinery': return '⚙️'
      case 'environmental': return '🌿'
      default: return '🌡️'
    }
  }

  const handleZoneClick = (zone) => {
    setSelectedZone(zone)
    alert(`🔥 THERMAL SIGNATURE DETAILS:\n\nType: ${zone.type.toUpperCase()}\nTemperature: ${zone.temperature.toFixed(1)}°C\nIntensity: ${zone.intensity.toFixed(1)}%\nLocation: ${zone.x.toFixed(1)}, ${zone.y.toFixed(1)}\nTime: ${zone.timestamp}\n\nAnalysis: ${getThermalAnalysis(zone)}`)
  }

  const getThermalAnalysis = (zone) => {
    if (zone.type === 'human' && zone.temperature > 35) return 'Suspicious human activity detected'
    if (zone.type === 'vehicle' && zone.temperature > 50) return 'Vehicle engine running - possible unauthorized activity'
    if (zone.type === 'fire') return 'Fire detected - immediate response required'
    if (zone.type === 'machinery' && zone.temperature > 40) return 'Industrial machinery active outside normal hours'
    return 'Normal thermal signature'
  }

  const startThermalScan = () => {
    setScanning(true)
    alert('🔥 ENHANCED THERMAL SCAN INITIATED!\n\n- All thermal drones activated\n- Enhanced sensitivity mode\n- Scanning range: 3.5 km\n- Detection threshold: 5°C above ambient\n- Processing thermal signatures...')
    
    setTimeout(() => {
      setScanning(false)
      // Add new thermal data during scan
      const newZones = Array.from({ length: 5 }, () => generateThermalActivity())
      setThermalData(prev => [...prev, ...newZones])
    }, 4000)
  }

  const getThermalModeStyle = () => {
    switch (thermalMode) {
      case 'enhanced':
        return { filter: 'contrast(1.5) saturate(1.8) brightness(1.2)' }
      case 'night':
        return { filter: 'brightness(0.4) contrast(2) saturate(1.5)' }
      default:
        return {}
    }
  }

  const getActiveThermalDrones = () => {
    return drones.filter(drone => drone.type === 'Thermal' && drone.isActive)
  }

  return (
    <div className="thermal-view">
      <div className="thermal-header">
        <h2>🔥 Thermal Imaging System</h2>
        <div className="thermal-controls">
          <button 
            className={`thermal-mode-btn ${thermalMode === 'standard' ? 'active' : ''}`}
            onClick={() => setThermalMode('standard')}
          >
            Standard
          </button>
          <button 
            className={`thermal-mode-btn ${thermalMode === 'enhanced' ? 'active' : ''}`}
            onClick={() => setThermalMode('enhanced')}
          >
            Enhanced
          </button>
          <button 
            className={`thermal-mode-btn ${thermalMode === 'night' ? 'active' : ''}`}
            onClick={() => setThermalMode('night')}
          >
            Night Vision
          </button>
          <button 
            className={`scan-btn ${scanning ? 'scanning' : ''}`}
            onClick={startThermalScan}
            disabled={scanning}
          >
            {scanning ? '🔍 SCANNING...' : '🔍 Enhanced Scan'}
          </button>
        </div>
      </div>

      <div className="thermal-container" style={getThermalModeStyle()}>
        <div className="thermal-grid">
          {/* Thermal zones */}
          {thermalData.map((zone) => (
            <div
              key={zone.id}
              className={`thermal-zone ${zone.type} ${zone.intensity > 70 ? 'high-intensity' : ''}`}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                backgroundColor: getThermalColor(zone.temperature),
                opacity: zone.intensity / 100
              }}
              onClick={() => handleZoneClick(zone)}
            >
              <div className="thermal-icon">{getThermalIcon(zone.type)}</div>
              <div className="thermal-temp">{zone.temperature.toFixed(1)}°C</div>
              <div className="thermal-intensity">{zone.intensity.toFixed(0)}%</div>
            </div>
          ))}

          {/* Active thermal drones */}
          {getActiveThermalDrones().map(drone => (
            <div
              key={drone.id}
              className="thermal-drone"
              style={{
                left: `${50 + (drone.location.lng - 77.2090) * 1000}%`,
                top: `${50 + (drone.location.lat - 28.6139) * 1000}%`
              }}
            >
              <div className="drone-thermal-icon">🛸</div>
              <div className="drone-thermal-name">{drone.name}</div>
              <div className="drone-thermal-battery">{drone.battery}%</div>
            </div>
          ))}

          {/* Temperature scale */}
          <div className="temperature-scale">
            <div className="scale-label">Temperature Scale</div>
            <div className="scale-gradient">
              <div className="scale-color" style={{ backgroundColor: '#0000ff' }}>Cold</div>
              <div className="scale-color" style={{ backgroundColor: '#00ffff' }}>Cool</div>
              <div className="scale-color" style={{ backgroundColor: '#00ff00' }}>Normal</div>
              <div className="scale-color" style={{ backgroundColor: '#ffff00' }}>Warm</div>
              <div className="scale-color" style={{ backgroundColor: '#ff8000' }}>Hot</div>
              <div className="scale-color" style={{ backgroundColor: '#ff0000' }}>Very Hot</div>
            </div>
          </div>
        </div>
      </div>

      {/* Thermal statistics */}
      <div className="thermal-stats">
        <div className="stat-card">
          <h3>Thermal Activity</h3>
          <div className="stat-value">{thermalData.length}</div>
          <div className="stat-label">Active Zones</div>
        </div>
        <div className="stat-card">
          <h3>High Intensity</h3>
          <div className="stat-value">{thermalData.filter(z => z.intensity > 70).length}</div>
          <div className="stat-label">Critical Zones</div>
        </div>
        <div className="stat-card">
          <h3>Thermal Drones</h3>
          <div className="stat-value">{getActiveThermalDrones().length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <h3>Avg Temperature</h3>
          <div className="stat-value">
            {(thermalData.reduce((sum, z) => sum + z.temperature, 0) / thermalData.length || 0).toFixed(1)}°C
          </div>
          <div className="stat-label">Ambient</div>
        </div>
      </div>

      {/* Thermal legend */}
      <div className="thermal-legend">
        <div className="legend-item">
          <span className="legend-icon">👤</span>
          <span>Human Activity</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🚗</span>
          <span>Vehicle</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🔥</span>
          <span>Fire</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">⚙️</span>
          <span>Machinery</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🌿</span>
          <span>Environmental</span>
        </div>
      </div>

      {/* Selected zone details */}
      {selectedZone && (
        <div className="zone-details">
          <h3>Zone Details</h3>
          <p><strong>Type:</strong> {selectedZone.type}</p>
          <p><strong>Temperature:</strong> {selectedZone.temperature.toFixed(1)}°C</p>
          <p><strong>Intensity:</strong> {selectedZone.intensity.toFixed(1)}%</p>
          <p><strong>Location:</strong> {selectedZone.x.toFixed(1)}, {selectedZone.y.toFixed(1)}</p>
          <p><strong>Time:</strong> {selectedZone.timestamp}</p>
          <p><strong>Analysis:</strong> {getThermalAnalysis(selectedZone)}</p>
          <button onClick={() => setSelectedZone(null)}>Close</button>
        </div>
      )}
    </div>
  )
}

export default ThermalView 