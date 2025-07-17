import React, { useEffect, useState } from 'react';

const SwarmCoordinationPortal = () => {
  const [swarm, setSwarm] = useState([]);
  const [role, setRole] = useState('');
  const [drone, setDrone] = useState('');
  const [behavior, setBehavior] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/swarm/status')
      .then(res => res.json())
      .then(data => setSwarm(data.drones || []));
  }, []);

  const assignRole = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/swarm/assign-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ droneId: drone, role })
    });
    const data = await res.json();
    setMessage(data.success ? 'Role assigned!' : 'Failed to assign role');
  };

  const setSwarmBehavior = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/swarm/set-behavior', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ behavior })
    });
    const data = await res.json();
    setMessage(data.success ? 'Behavior set!' : 'Failed to set behavior');
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Swarm Coordination</h2>
      <h3>Current Swarm Status</h3>
      <ul>
        {swarm.map(d => (
          <li key={d.name}>{d.name}: {d.role} ({d.behavior})</li>
        ))}
      </ul>
      <form onSubmit={assignRole} style={{ marginTop: 20 }}>
        <h4>Assign Role</h4>
        <input placeholder="Drone ID" value={drone} onChange={e => setDrone(e.target.value)} required />
        <input placeholder="Role" value={role} onChange={e => setRole(e.target.value)} required />
        <button type="submit">Assign</button>
      </form>
      <form onSubmit={setSwarmBehavior} style={{ marginTop: 20 }}>
        <h4>Set Swarm Behavior</h4>
        <input placeholder="Behavior" value={behavior} onChange={e => setBehavior(e.target.value)} required />
        <button type="submit">Set Behavior</button>
      </form>
      {message && <div style={{ marginTop: 10, color: 'green' }}>{message}</div>}
    </div>
  );
};

export default SwarmCoordinationPortal; 