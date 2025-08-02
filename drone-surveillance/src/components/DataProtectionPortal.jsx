import React, { useState, useEffect } from 'react';
import encryptionService from '../utils/encryption';

const DataProtectionPortal = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [encryptionSettings, setEncryptionSettings] = useState({
    dataAtRest: true,
    dataInTransit: true,
    dataInUse: false,
    keyRotation: 'automatic',
    encryptionAlgorithm: 'AES-256-GCM'
  });
  
  const [dataMasking, setDataMasking] = useState({
    personalInfo: true,
    locationData: false,
    metadata: true,
    timestamps: false
  });
  
  const [complianceStatus, setComplianceStatus] = useState({
    gdpr: 'compliant',
    hipaa: 'compliant',
    sox: 'compliant',
    iso27001: 'compliant'
  });

  const [testData, setTestData] = useState({
    original: 'Sensitive drone surveillance data: Location 28.6139, 77.2090, Target ID: TGT-001, Operator: John Doe',
    encrypted: '',
    masked: '',
    hashed: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    processTestData();
  }, []);

  const processTestData = async () => {
    setIsProcessing(true);
    try {
      const encrypted = await encryptionService.encryptData(testData.original);
      const masked = maskSensitiveData(testData.original);
      const hashed = encryptionService.hashData(testData.original);
      
      setTestData(prev => ({
        ...prev,
        encrypted: encrypted,
        masked: masked,
        hashed: hashed.hash
      }));
    } catch (error) {
      console.error('Data processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const maskSensitiveData = (data) => {
    let masked = data;
    masked = masked.replace(/(\d+\.\d+), (\d+\.\d+)/g, '***.***, ***.***');
    masked = masked.replace(/TGT-\d+/g, 'TGT-***');
    masked = masked.replace(/([A-Z][a-z]+ [A-Z][a-z]+)/g, '*** ***');
    return masked;
  };

  const getComplianceColor = (status) => {
    const colors = {
      compliant: '#10b981',
      partial: '#f59e0b',
      non_compliant: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getComplianceIcon = (status) => {
    const icons = {
      compliant: '✅',
      partial: '⚠️',
      non_compliant: '❌'
    };
    return icons[status] || '❓';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f1f5f9',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            margin: '0 0 10px 0', 
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🛡️ Data Protection & Privacy Portal
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
            Comprehensive Data Security, Encryption & Compliance Management
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'encryption', label: '🔒 Encryption' },
            { id: 'masking', label: '🎭 Data Masking' },
            { id: 'compliance', label: '📋 Compliance' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(51, 65, 85, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 'clamp(0.8rem, 2vw, 1rem)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Data Protection Status */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {[
                { 
                  label: 'Data Encryption', 
                  value: 'ACTIVE', 
                  icon: '🔒', 
                  color: '#10b981',
                  subtitle: 'AES-256-GCM encryption'
                },
                { 
                  label: 'Privacy Controls', 
                  value: 'ENABLED', 
                  icon: '🔐', 
                  color: '#3b82f6',
                  subtitle: 'GDPR compliant'
                },
                { 
                  label: 'Data Masking', 
                  value: 'ACTIVE', 
                  icon: '🎭', 
                  color: '#8b5cf6',
                  subtitle: 'Sensitive data protected'
                },
                { 
                  label: 'Compliance', 
                  value: '100%', 
                  icon: '✅', 
                  color: '#10b981',
                  subtitle: 'All standards met'
                }
              ].map((metric, index) => (
                <div key={index} style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  padding: '25px',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '2.5em', marginBottom: '15px' }}>{metric.icon}</div>
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: metric.color, marginBottom: '5px' }}>
                    {metric.value}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '1.1em', marginBottom: '5px' }}>{metric.label}</div>
                  <div style={{ color: '#64748b', fontSize: '0.9em' }}>{metric.subtitle}</div>
                </div>
              ))}
            </div>

            {/* Data Processing Demo */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              padding: '30px',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <h3 style={{ marginBottom: '20px' }}>🔬 Data Processing Demo</h3>
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#10b981' }}>Original Data</h4>
                  <div style={{
                    padding: '15px',
                    background: 'rgba(51, 65, 85, 0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    fontFamily: 'monospace',
                    fontSize: '0.9em'
                  }}>
                    {testData.original}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#3b82f6' }}>Encrypted Data</h4>
                  <div style={{
                    padding: '15px',
                    background: 'rgba(51, 65, 85, 0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    fontFamily: 'monospace',
                    fontSize: '0.8em',
                    wordBreak: 'break-all'
                  }}>
                    {isProcessing ? 'Processing...' : testData.encrypted.substring(0, 100) + '...'}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#8b5cf6' }}>Masked Data</h4>
                  <div style={{
                    padding: '15px',
                    background: 'rgba(51, 65, 85, 0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    fontFamily: 'monospace',
                    fontSize: '0.9em'
                  }}>
                    {testData.masked}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#f59e0b' }}>Hashed Data</h4>
                  <div style={{
                    padding: '15px',
                    background: 'rgba(51, 65, 85, 0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    fontFamily: 'monospace',
                    fontSize: '0.8em',
                    wordBreak: 'break-all'
                  }}>
                    {testData.hashed}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Encryption Tab */}
        {activeTab === 'encryption' && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <h3 style={{ marginBottom: '20px' }}>🔒 Encryption Settings</h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <h4 style={{ marginBottom: '15px' }}>Encryption Types</h4>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={encryptionSettings.dataAtRest}
                        onChange={(e) => setEncryptionSettings(prev => ({...prev, dataAtRest: e.target.checked}))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span>Data at Rest</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={encryptionSettings.dataInTransit}
                        onChange={(e) => setEncryptionSettings(prev => ({...prev, dataInTransit: e.target.checked}))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span>Data in Transit</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={encryptionSettings.dataInUse}
                        onChange={(e) => setEncryptionSettings(prev => ({...prev, dataInUse: e.target.checked}))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span>Data in Use (Memory)</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ marginBottom: '15px' }}>Key Management</h4>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Key Rotation</label>
                      <select
                        value={encryptionSettings.keyRotation}
                        onChange={(e) => setEncryptionSettings(prev => ({...prev, keyRotation: e.target.value}))}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          background: 'rgba(51, 65, 85, 0.5)',
                          color: '#f1f5f9',
                          width: '100%'
                        }}
                      >
                        <option value="automatic">Automatic</option>
                        <option value="manual">Manual</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px' }}>Algorithm</label>
                      <select
                        value={encryptionSettings.encryptionAlgorithm}
                        onChange={(e) => setEncryptionSettings(prev => ({...prev, encryptionAlgorithm: e.target.value}))}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          background: 'rgba(51, 65, 85, 0.5)',
                          color: '#f1f5f9',
                          width: '100%'
                        }}
                      >
                        <option value="AES-256-GCM">AES-256-GCM</option>
                        <option value="AES-256-CBC">AES-256-CBC</option>
                        <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Masking Tab */}
        {activeTab === 'masking' && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <h3 style={{ marginBottom: '20px' }}>🎭 Data Masking Configuration</h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px'
              }}>
                <div>
                  <h4 style={{ marginBottom: '15px' }}>Sensitive Data Types</h4>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={dataMasking.personalInfo}
                        onChange={(e) => setDataMasking(prev => ({...prev, personalInfo: e.target.checked}))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span>Personal Information</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={dataMasking.locationData}
                        onChange={(e) => setDataMasking(prev => ({...prev, locationData: e.target.checked}))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span>Location Data</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={dataMasking.metadata}
                        onChange={(e) => setDataMasking(prev => ({...prev, metadata: e.target.checked}))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span>Metadata</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="checkbox"
                        checked={dataMasking.timestamps}
                        onChange={(e) => setDataMasking(prev => ({...prev, timestamps: e.target.checked}))}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      <span>Timestamps</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ marginBottom: '15px' }}>Masking Methods</h4>
                  <div style={{
                    padding: '15px',
                    background: 'rgba(51, 65, 85, 0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.1)'
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Substitution:</strong> Replace with asterisks
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Randomization:</strong> Replace with random values
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Hashing:</strong> One-way transformation
                    </div>
                    <div>
                      <strong>Generalization:</strong> Reduce precision
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <h3 style={{ marginBottom: '20px' }}>📋 Compliance Status</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {Object.entries(complianceStatus).map(([standard, status]) => (
                <div key={standard} style={{
                  padding: '20px',
                  background: 'rgba(51, 65, 85, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2em', marginBottom: '10px' }}>
                    {getComplianceIcon(status)}
                  </div>
                  <div style={{ 
                    fontSize: '1.5em', 
                    fontWeight: 'bold', 
                    color: getComplianceColor(status),
                    marginBottom: '5px'
                  }}>
                    {standard.toUpperCase()}
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    {status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataProtectionPortal; 