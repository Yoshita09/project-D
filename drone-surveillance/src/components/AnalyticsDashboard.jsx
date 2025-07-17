import React, { useState, useEffect } from 'react';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState({
    performance: {
      detectionAccuracy: 94.2,
      responseTime: 2.3,
      systemUptime: 99.8,
      falsePositives: 3.2,
      threatsNeutralized: 127,
      coverageArea: 85.7
    },
    trends: {
      dailyDetections: [45, 52, 38, 67, 89, 76, 94],
      threatLevels: [12, 18, 15, 22, 31, 28, 35],
      systemEfficiency: [92, 94, 91, 96, 93, 95, 97]
    },
    historical: {
      monthlyThreats: [156, 189, 234, 198, 267, 245, 289],
      monthlyNeutralizations: [142, 175, 218, 185, 251, 232, 274],
      monthlyAccuracy: [91.2, 92.6, 93.1, 93.8, 94.2, 94.7, 94.9]
    }
  });

  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('detections');

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          detectionAccuracy: prev.performance.detectionAccuracy + (Math.random() - 0.5) * 0.2,
          responseTime: prev.performance.responseTime + (Math.random() - 0.5) * 0.1,
          systemUptime: prev.performance.systemUptime + (Math.random() - 0.5) * 0.05
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const generateChartData = (data, label) => {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label,
        data,
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.4
      }]
    };
  };

  const getMetricColor = (value, threshold) => {
    if (value >= threshold) return '#4CAF50';
    if (value >= threshold * 0.8) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>📊 Analytics Dashboard</h2>
        <div className="period-selector">
          <button 
            className={selectedPeriod === 'week' ? 'active' : ''}
            onClick={() => setSelectedPeriod('week')}
          >
            Week
          </button>
          <button 
            className={selectedPeriod === 'month' ? 'active' : ''}
            onClick={() => setSelectedPeriod('month')}
          >
            Month
          </button>
          <button 
            className={selectedPeriod === 'year' ? 'active' : ''}
            onClick={() => setSelectedPeriod('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <h3>🎯 Detection Accuracy</h3>
            <span className="metric-value" style={{ color: getMetricColor(analyticsData.performance.detectionAccuracy, 90) }}>
              {analyticsData.performance.detectionAccuracy.toFixed(1)}%
            </span>
          </div>
          <div className="metric-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${analyticsData.performance.detectionAccuracy}%`,
                backgroundColor: getMetricColor(analyticsData.performance.detectionAccuracy, 90)
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>⚡ Response Time</h3>
            <span className="metric-value" style={{ color: getMetricColor(analyticsData.performance.responseTime, 5, true) }}>
              {analyticsData.performance.responseTime.toFixed(1)}s
            </span>
          </div>
          <div className="metric-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${(5 - analyticsData.performance.responseTime) * 20}%`,
                backgroundColor: getMetricColor(analyticsData.performance.responseTime, 5, true)
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>🔄 System Uptime</h3>
            <span className="metric-value" style={{ color: getMetricColor(analyticsData.performance.systemUptime, 99) }}>
              {analyticsData.performance.systemUptime.toFixed(1)}%
            </span>
          </div>
          <div className="metric-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${analyticsData.performance.systemUptime}%`,
                backgroundColor: getMetricColor(analyticsData.performance.systemUptime, 99)
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>🎯 Threats Neutralized</h3>
            <span className="metric-value">
              {analyticsData.performance.threatsNeutralized}
            </span>
          </div>
          <div className="metric-trend">
            <span className="trend-indicator positive">+12%</span>
            <span className="trend-period">vs last week</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>📡 Coverage Area</h3>
            <span className="metric-value" style={{ color: getMetricColor(analyticsData.performance.coverageArea, 80) }}>
              {analyticsData.performance.coverageArea.toFixed(1)}%
            </span>
          </div>
          <div className="metric-progress">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${analyticsData.performance.coverageArea}%`,
                backgroundColor: getMetricColor(analyticsData.performance.coverageArea, 80)
              }}
            ></div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>❌ False Positives</h3>
            <span className="metric-value" style={{ color: getMetricColor(analyticsData.performance.falsePositives, 5, true) }}>
              {analyticsData.performance.falsePositives.toFixed(1)}%
            </span>
          </div>
          <div className="metric-trend">
            <span className="trend-indicator negative">-8%</span>
            <span className="trend-period">vs last week</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>📈 Detection Trends</h3>
          <div className="chart-selector">
            <button 
              className={selectedMetric === 'detections' ? 'active' : ''}
              onClick={() => setSelectedMetric('detections')}
            >
              Detections
            </button>
            <button 
              className={selectedMetric === 'threats' ? 'active' : ''}
              onClick={() => setSelectedMetric('threats')}
            >
              Threats
            </button>
            <button 
              className={selectedMetric === 'efficiency' ? 'active' : ''}
              onClick={() => setSelectedMetric('efficiency')}
            >
              Efficiency
            </button>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {analyticsData.trends.dailyDetections.map((value, index) => (
                <div 
                  key={index} 
                  className="chart-bar"
                  style={{ height: `${(value / 100) * 200}px` }}
                >
                  <span className="bar-value">{value}</span>
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <span key={day} className="chart-label">{day}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h3>📊 Historical Performance</h3>
          <div className="historical-metrics">
            <div className="historical-item">
              <span className="label">Total Threats:</span>
              <span className="value">{analyticsData.historical.monthlyThreats.reduce((a, b) => a + b, 0)}</span>
            </div>
            <div className="historical-item">
              <span className="label">Neutralized:</span>
              <span className="value">{analyticsData.historical.monthlyNeutralizations.reduce((a, b) => a + b, 0)}</span>
            </div>
            <div className="historical-item">
              <span className="label">Success Rate:</span>
              <span className="value">
                {((analyticsData.historical.monthlyNeutralizations.reduce((a, b) => a + b, 0) / 
                   analyticsData.historical.monthlyThreats.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="reports-section">
        <h3>📋 Generated Reports</h3>
        <div className="reports-grid">
          <div className="report-card">
            <h4>Daily Summary</h4>
            <p>Threat analysis and system performance overview</p>
            <button className="download-btn">📥 Download</button>
          </div>
          <div className="report-card">
            <h4>Weekly Analysis</h4>
            <p>Trend analysis and performance metrics</p>
            <button className="download-btn">📥 Download</button>
          </div>
          <div className="report-card">
            <h4>Monthly Report</h4>
            <p>Comprehensive system performance and threat assessment</p>
            <button className="download-btn">📥 Download</button>
          </div>
          <div className="report-card">
            <h4>Custom Report</h4>
            <p>Generate custom analytics report</p>
            <button className="generate-btn">🔧 Generate</button>
          </div>
        </div>
      </div>

      {/* Real-time Alerts */}
      <div className="alerts-section">
        <h3>🚨 Real-time Alerts</h3>
        <div className="alerts-list">
          <div className="alert-item warning">
            <span className="alert-time">2 min ago</span>
            <span className="alert-message">Detection accuracy dropped to 89%</span>
          </div>
          <div className="alert-item info">
            <span className="alert-time">5 min ago</span>
            <span className="alert-message">New threat pattern detected</span>
          </div>
          <div className="alert-item success">
            <span className="alert-time">8 min ago</span>
            <span className="alert-message">System performance optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 