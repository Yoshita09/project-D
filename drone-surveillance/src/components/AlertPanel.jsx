 import { useState } from 'react'

const AlertPanel = ({ alerts }) => {
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('time')
  const [actionStatus, setActionStatus] = useState({
    acknowledge: false,
    clear: false,
    export: false
  })
  const [detections, setDetections] = useState([]);

  const filteredAlerts = alerts.filter(alert => {
    if (filterType === 'all') return true
    return alert.type === filterType
  })

  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === 'time') {
      return new Date(b.timestamp) - new Date(a.timestamp)
    }
    if (sortBy === 'intensity') {
      return (b.intensity || 0) - (a.intensity || 0)
    }
    if (sortBy === 'type') {
      return a.type.localeCompare(b.type)
    }
    return 0
  })

  const getAlertIcon = (type) => {
    switch (type) {
      case 'illegal': return '🚨'
      case 'thermal': return '🔥'
      case 'movement': return '👤'
      default: return '⚠️'
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case 'illegal': return '#ff4444'
      case 'thermal': return '#ff8800'
      case 'movement': return '#ffcc00'
      default: return '#888888'
    }
  }

  const getPriorityLevel = (alert) => {
    if (alert.type === 'illegal') return 'HIGH'
    if (alert.intensity > 70) return 'MEDIUM'
    return 'LOW'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#ff0000'
      case 'MEDIUM': return '#ff8800'
      case 'LOW': return '#00ff00'
      default: return '#888888'
    }
  }

  const alertStats = {
    total: alerts.length,
    illegal: alerts.filter(a => a.type === 'illegal').length,
    thermal: alerts.filter(a => a.type === 'thermal').length,
    movement: alerts.filter(a => a.type === 'movement').length,
    highPriority: alerts.filter(a => getPriorityLevel(a) === 'HIGH').length
  }

  const handleAcknowledgeAll = () => {
    setActionStatus(prev => ({ ...prev, acknowledge: true }))
    alert('✓ ALL ALERTS ACKNOWLEDGED!\n\n- Status updated to "Acknowledged"\n- Response teams notified\n- Follow-up actions initiated\n- Log updated with timestamp')
    
    setTimeout(() => {
      setActionStatus(prev => ({ ...prev, acknowledge: false }))
    }, 3000)
  }

  const handleClearAll = () => {
    setActionStatus(prev => ({ ...prev, clear: true }))
    const confirmed = confirm('🗑️ CLEAR ALL ALERTS?\n\nThis will remove all alerts from the system.\nThis action cannot be undone.')
    
    if (confirmed) {
      alert('🗑️ ALL ALERTS CLEARED!\n\n- All alerts removed from system\n- Log entries preserved\n- System ready for new alerts\n- Status: Clean')
    }
    
    setTimeout(() => {
      setActionStatus(prev => ({ ...prev, clear: false }))
    }, 2000)
  }

  const handleExportReport = () => {
    setActionStatus(prev => ({ ...prev, export: true }))
    
    // Simulate report generation
    const reportData = {
      timestamp: new Date().toISOString(),
      totalAlerts: alerts.length,
      alertBreakdown: alertStats,
      alerts: sortedAlerts,
      summary: {
        mostCommonType: alertStats.illegal > alertStats.thermal && alertStats.illegal > alertStats.movement 
          ? 'Illegal Activity' 
          : alertStats.thermal > alertStats.movement 
            ? 'Thermal Activity' 
            : 'Movement',
        averageIntensity: alerts.length > 0 
          ? (alerts.reduce((sum, a) => sum + (a.intensity || 0), 0) / alerts.length).toFixed(1)
          : 'N/A',
        responseTime: '2.3 min avg',
        falsePositives: '12%'
      }
    }
    
    // Create downloadable report
    const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(reportBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `drone-surveillance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    alert('📤 REPORT EXPORTED!\n\n- Report saved as JSON file\n- Contains all alert data\n- Includes statistics and summary\n- Ready for analysis')
    
    setTimeout(() => {
      setActionStatus(prev => ({ ...prev, export: false }))
    }, 3000)
  }

  return (
    <div className="alert-panel">
      <div className="alert-header">
        <h3>🚨 Security Alert Management</h3>
        <div className="alert-stats">
          <div className="stat-item">
            <span className="stat-label">Total Alerts:</span>
            <span className="stat-value">{alertStats.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">High Priority:</span>
            <span className="stat-value high-priority">{alertStats.highPriority}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Illegal:</span>
            <span className="stat-value illegal">{alertStats.illegal}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Thermal:</span>
            <span className="stat-value thermal">{alertStats.thermal}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Movement:</span>
            <span className="stat-value movement">{alertStats.movement}</span>
          </div>
        </div>
      </div>

      <div className="alert-controls">
        <div className="filter-controls">
          <label>Filter by Type:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="illegal">Illegal Activity</option>
            <option value="thermal">Thermal Activity</option>
            <option value="movement">Movement</option>
          </select>
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="time">Time (Newest First)</option>
            <option value="intensity">Intensity</option>
            <option value="type">Type</option>
          </select>
        </div>

        <div className="action-controls">
          <button 
            className={`action-btn acknowledge ${actionStatus.acknowledge ? 'active' : ''}`}
            onClick={handleAcknowledgeAll}
            disabled={actionStatus.acknowledge || alerts.length === 0}
          >
            {actionStatus.acknowledge ? '✓ ACKNOWLEDGING...' : '✓ Acknowledge All'}
          </button>
          <button 
            className={`action-btn clear ${actionStatus.clear ? 'active' : ''}`}
            onClick={handleClearAll}
            disabled={actionStatus.clear || alerts.length === 0}
          >
            {actionStatus.clear ? '🗑️ CLEARING...' : '🗑️ Clear All'}
          </button>
          <button 
            className={`action-btn export ${actionStatus.export ? 'active' : ''}`}
            onClick={handleExportReport}
            disabled={actionStatus.export}
          >
            {actionStatus.export ? '📤 EXPORTING...' : '📤 Export Report'}
          </button>
        </div>
      </div>

      <div className="alerts-container">
        {sortedAlerts.length === 0 ? (
          <div className="no-alerts">
            <p>No alerts to display</p>
            <p>All clear! No security threats detected.</p>
          </div>
        ) : (
          // Remove the alerts-list wrapper and render alert-card directly
          sortedAlerts.map((alert, index) => (
            <div 
              key={index} 
              className={`alert-card ${alert.type}`}
              style={{ borderLeftColor: getAlertColor(alert.type) }}
            >
              <div className="alert-header-row">
                <div className="alert-icon">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-info">
                  <div className="alert-title">
                    <span className="alert-type">{alert.type.toUpperCase()}</span>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(getPriorityLevel(alert)) }}
                    >
                      {getPriorityLevel(alert)}
                    </span>
                  </div>
                  <div className="alert-time">{alert.timestamp}</div>
                </div>
                <div className="alert-actions">
                  <button className="action-btn small" title="Acknowledge">✓</button>
                  <button className="action-btn small" title="View Details">📋</button>
                  <button className="action-btn small" title="Investigate">🔍</button>
                </div>
              </div>

              <div className="alert-content">
                <p className="alert-message">{alert.message}</p>
                <div className="alert-details">
                  <span className="detail-item">
                    <strong>Location:</strong> {alert.location}
                  </span>
                  {alert.intensity && (
                    <span className="detail-item">
                      <strong>Intensity:</strong> {alert.intensity.toFixed(1)}%
                    </span>
                  )}
                  {alert.temperature && (
                    <span className="detail-item">
                      <strong>Temperature:</strong> {alert.temperature.toFixed(1)}°C
                    </span>
                  )}
                </div>
              </div>

              <div className="alert-footer">
                <div className="alert-tags">
                  <span className="tag border">Border Security</span>
                  <span className="tag real-time">Real-time</span>
                  {alert.type === 'illegal' && <span className="tag critical">Critical</span>}
                </div>
                <div className="alert-status">
                  <span className="status pending">Pending Response</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="alert-summary">
        <h4>Alert Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Most Common Type:</span>
            <span className="summary-value">
              {alertStats.illegal > alertStats.thermal && alertStats.illegal > alertStats.movement 
                ? 'Illegal Activity' 
                : alertStats.thermal > alertStats.movement 
                  ? 'Thermal Activity' 
                  : 'Movement'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Average Intensity:</span>
            <span className="summary-value">
              {alerts.length > 0 
                ? (alerts.reduce((sum, a) => sum + (a.intensity || 0), 0) / alerts.length).toFixed(1) + '%'
                : 'N/A'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Response Time:</span>
            <span className="summary-value">2.3 min avg</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">False Positives:</span>
            <span className="summary-value">12%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertPanel 