import React, { useState } from 'react';

const SecurityPortal = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [role, setRole] = useState('');
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');

  const login = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      setToken(data.token);
      setRole(data.role);
      setMessage('Login successful!');
      fetchLogs();
    } else {
      setMessage('Login failed!');
    }
  };

  const fetchLogs = async () => {
    const res = await fetch('http://localhost:5000/api/auth/access-log');
    const data = await res.json();
    setLogs(data.logs || []);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Security, Access & Roles</h2>
      {!token ? (
        <form onSubmit={login}>
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div>
          <div>Role: {role}</div>
          <button onClick={() => { setToken(''); setRole(''); setLogs([]); }}>Logout</button>
          <h4>Access Log</h4>
          <ul>
            {logs.map((log, i) => (
              <li key={i}>{log.user} - {log.action} - {log.time}</li>
            ))}
          </ul>
        </div>
      )}
      {message && <div style={{ marginTop: 10, color: 'green' }}>{message}</div>}
    </div>
  );
};

export default SecurityPortal; 