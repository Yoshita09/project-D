import React, { useState, useEffect, useCallback } from 'react';

const SecurityPortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [securityMetrics, setSecurityMetrics] = useState({
    activeUsers: 12,
    failedAttempts: 3,
    securityAlerts: 2,
    systemHealth: 98.5
  });
  const [securityEvents, setSecurityEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(['Admin', 'Operator', 'Viewer', 'Guest']);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');

  // Valid credentials
  const validCredentials = {
    'ashutosh': {
      password: 'admin123',
      fullName: 'Ashutosh Mishra',
      role: 'System Administrator',
      permissions: ['read', 'write', 'delete', 'admin', 'security_override', 'system_config'],
      email: 'ashutosh.mishra@military-surveillance.com',
      department: 'Cyber Security & Defense',
      clearance: 'Top Secret',
      lastLogin: new Date(),
      sessionTimeout: 480 // 8 hours
    },
    'admin': {
      password: 'admin123',
      fullName: 'Ashutosh Mishra',
      role: 'Admin',
      permissions: ['read', 'write', 'delete', 'admin']
    }
  };

  // Simulate real-time security events
  useEffect(() => {
    const generateSecurityEvent = () => ({
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type: ['login', 'logout', 'failed_auth', 'permission_change', 'security_alert'][Math.floor(Math.random() * 5)],
      user: ['admin', 'operator1', 'viewer2', 'guest3'][Math.floor(Math.random() * 4)],
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      level: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      description: 'Security event detected'
    });

    const interval = setInterval(() => {
      if (isAuthenticated) {
        setSecurityEvents(prev => [generateSecurityEvent(), ...prev.slice(0, 49)]);
        setSecurityMetrics(prev => ({
          ...prev,
          activeUsers: Math.max(1, prev.activeUsers + (Math.random() > 0.5 ? 1 : -1)),
          failedAttempts: Math.max(0, prev.failedAttempts + (Math.random() > 0.7 ? 1 : 0)),
          securityAlerts: Math.max(0, prev.securityAlerts + (Math.random() > 0.9 ? 1 : -1))
        }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Initialize mock users
  useEffect(() => {
    setUsers([
      { id: 1, username: 'admin', fullName: 'Ashutosh Mishra', role: 'Admin', status: 'active', lastLogin: new Date() },
      { id: 2, username: 'operator1', fullName: 'John Doe', role: 'Operator', status: 'active', lastLogin: new Date(Date.now() - 3600000) },
      { id: 3, username: 'viewer2', fullName: 'Jane Smith', role: 'Viewer', status: 'inactive', lastLogin: new Date(Date.now() - 86400000) }
    ]);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { username, password } = loginForm;
    const user = validCredentials[username];

    if (user && user.password === password) {
      setIsAuthenticated(true);
      setCurrentUser({
        username,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions,
        loginTime: new Date()
      });

      // Add login event
      const loginEvent = {
        id: Date.now(),
        timestamp: new Date(),
        type: 'login',
        user: username,
        ip: '192.168.1.100',
        level: 'low',
        description: `Successful login for ${user.fullName}`
      };
      setSecurityEvents(prev => [loginEvent, ...prev]);

      setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('Invalid username or password');

      // Add failed login event
      const failedEvent = {
        id: Date.now(),
        timestamp: new Date(),
        type: 'failed_auth',
        user: username || 'unknown',
        ip: '192.168.1.100',
        level: 'medium',
        description: 'Failed login attempt'
      };
      setSecurityEvents(prev => [failedEvent, ...prev]);
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    // Add logout event
    const logoutEvent = {
      id: Date.now(),
      timestamp: new Date(),
      type: 'logout',
      user: currentUser.username,
      ip: '192.168.1.100',
      level: 'low',
      description: `User ${currentUser.fullName} logged out`
    };
    setSecurityEvents(prev => [logoutEvent, ...prev]);

    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const filteredEvents = securityEvents.filter(event =>
    filterLevel === 'all' || event.level === filterLevel
  ).sort((a, b) => {
    if (sortBy === 'timestamp') return new Date(b.timestamp) - new Date(a.timestamp);
    if (sortBy === 'level') return b.level.localeCompare(a.level);
    return a.type.localeCompare(b.type);
  });

  const getEventIcon = (type) => {
    const icons = {
      login: '🔓', logout: '🔒', failed_auth: '❌',
      permission_change: '⚙️', security_alert: '🚨'
    };
    return icons[type] || '📋';
  };

  const getLevelColor = (level) => {
    const colors = {
      low: '#4ade80', medium: '#fbbf24',
      high: '#f97316', critical: '#ef4444'
    };
    return colors[level] || '#6b7280';
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '40px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#f1f5f9', margin: '0 0 10px 0', fontSize: '1.8em' }}>
              🔐 Security Access
            </h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9em' }}>
              Enter your credentials to access the security portal
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontSize: '0.9em' }}>
                Username
              </label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username (admin)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(51, 65, 85, 0.6)',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontSize: '0.9em' }}>
                Password
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password (admin123)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(51, 65, 85, 0.6)',
                  color: '#f1f5f9',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)'}
                required
              />
            </div>

            {loginError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#fca5a5',
                fontSize: '0.9em',
                textAlign: 'center'
              }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: isLoading
                  ? 'rgba(107, 114, 128, 0.5)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Authenticating...
                </>
              ) : (
                'Access System'
              )}
            </button>
          </form>

          <div style={{
            marginTop: '30px',
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px'
          }}>
            <h4 style={{ color: '#93c5fd', margin: '0 0 8px 0', fontSize: '0.9em' }}>Demo Credentials:</h4>
            <p style={{ color: '#dbeafe', margin: '0', fontSize: '0.8em' }}>
              Username: <strong>ashutosh</strong> (Primary Admin)<br />
              Password: <strong>admin123</strong><br />
              User: <strong>Ashutosh Mishra</strong> (System Administrator)<br />
              <br />
              Username: <strong>admin</strong> (Legacy)<br />
              Password: <strong>admin123</strong>
            </p>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      color: '#f1f5f9',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header with user info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
              🛡️ Security Management Portal
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
              Welcome back, <strong>{currentUser.fullName}</strong> ({currentUser.role})
              {currentUser.username === 'ashutosh' && (
                <span style={{ 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  marginLeft: '10px',
                  fontSize: '0.8em',
                  color: 'white'
                }}>
                  🔐 TOP SECRET CLEARANCE
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'events', label: '📋 Security Events' },
            { id: 'users', label: '👥 User Management' },
            { id: 'settings', label: '⚙️ Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px)',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : 'rgba(51, 65, 85, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 'clamp(0.8rem, 2vw, 1rem)',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {[
                { label: 'Active Users', value: securityMetrics.activeUsers, icon: '👥', color: '#3b82f6' },
                { label: 'Failed Attempts', value: securityMetrics.failedAttempts, icon: '❌', color: '#ef4444' },
                { label: 'Security Alerts', value: securityMetrics.securityAlerts, icon: '🚨', color: '#f59e0b' },
                { label: 'System Health', value: `${securityMetrics.systemHealth}%`, icon: '💚', color: '#10b981' }
              ].map((metric, index) => (
                <div key={index} style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 'clamp(1.5em, 4vw, 2em)', marginBottom: '10px' }}>{metric.icon}</div>
                  <div style={{ fontSize: 'clamp(1.5em, 4vw, 2em)', fontWeight: 'bold', color: metric.color }}>
                    {metric.value}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>{metric.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <h3 style={{ marginBottom: '15px' }}>Recent Security Activity</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {securityEvents.slice(0, 5).map((event, index) => (
                  <div key={event.id} style={{
                    padding: '12px',
                    borderBottom: index < 4 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ fontSize: '1.2em' }}>{getEventIcon(event.type)}</div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
                        {event.type.replace('_', ' ').toUpperCase()} - {event.user}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)' }}>
                        {event.timestamp.toLocaleString()} | IP: {event.ip}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: getLevelColor(event.level),
                      color: 'white',
                      fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)',
                      fontWeight: '600'
                    }}>
                      {event.level.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '20px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(51, 65, 85, 0.5)',
                  color: '#f1f5f9',
                  fontSize: 'clamp(0.8rem, 2vw, 1rem)'
                }}
              >
                <option value="all">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  background: 'rgba(51, 65, 85, 0.5)',
                  color: '#f1f5f9',
                  fontSize: 'clamp(0.8rem, 2vw, 1rem)'
                }}
              >
                <option value="timestamp">Sort by Time</option>
                <option value="level">Sort by Level</option>
                <option value="type">Sort by Type</option>
              </select>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              maxHeight: '500px',
              overflowY: 'auto'
            }}>
              {filteredEvents.map((event, index) => (
                <div key={event.id} style={{
                  padding: '15px',
                  borderBottom: index < filteredEvents.length - 1 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ fontSize: '1.5em' }}>{getEventIcon(event.type)}</div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '5px', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
                      {event.type.replace('_', ' ').toUpperCase()} - {event.user}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)' }}>
                      {event.timestamp.toLocaleString()} | IP: {event.ip}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: getLevelColor(event.level),
                    color: 'white',
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)',
                    fontWeight: '600'
                  }}>
                    {event.level.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {users.map(user => (
                <div key={user.id} style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>{user.username}</h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{user.fullName}</p>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: user.status === 'active' ? '#10b981' : '#6b7280',
                      color: 'white',
                      fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)'
                    }}>
                      {user.status}
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', marginBottom: '10px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                    Role: {user.role}
                  </div>
                  <div style={{ color: '#94a3b8', marginBottom: '15px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                    Last Login: {user.lastLogin.toLocaleString()}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: 'clamp(0.8rem, 2vw, 1rem)'
                    }}
                  >
                    Manage User
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            padding: '30px',
            borderRadius: '12px',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)' }}>Security Settings</h3>
            <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
                <input type="checkbox" defaultChecked />
                Enable two-factor authentication
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
                <input type="checkbox" defaultChecked />
                Log all security events
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
                <input type="checkbox" />
                Send email alerts for critical events
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
                <input type="checkbox" defaultChecked />
                Auto-lock after 30 minutes of inactivity
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityPortal;