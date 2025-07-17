import React, { useEffect, useState, useRef } from 'react';

const IFFPortal = () => {
  const [drones, setDrones] = useState([]);
  const [drone, setDrone] = useState('');
  const [iff, setIff] = useState('friend');
  const [message, setMessage] = useState('');
  const wsRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/iff/list')
      .then(res => res.json())
      .then(data => setDrones(data.drones || []));
  }, []);

  useEffect(() => {
    wsRef.current = new window.WebSocket('ws://localhost:8080');
    wsRef.current.onopen = () => {
      wsRef.current.send(JSON.stringify({ type: 'register', role: 'client' }));
    };
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'iff_update' && data.droneId && data.status) {
          setDrones(prev => prev.map(d => d.name === data.droneId ? { ...d, iff: data.status } : d));
        }
      } catch { /* ignore */ }
    };
    return () => wsRef.current && wsRef.current.close();
  }, []);

  const tagDrone = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/iff/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ droneId: drone, iff })
    });
    const data = await res.json();
    setMessage(data.success ? 'Tag updated!' : 'Failed to update tag');
    // Optionally update UI immediately
    setDrones(prev => prev.map(d => d.name === drone ? { ...d, iff } : d));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Friend-or-Foe (IFF) System</h2>
      <h3>Current IFF Status</h3>
      <ul>
        {drones.map(d => (
          <li key={d.name}>{d.name}: {d.iff}</li>
        ))}
      </ul>
      <form onSubmit={tagDrone} style={{ marginTop: 20 }}>
        <h4>Tag Drone</h4>
        <input placeholder="Drone ID" value={drone} onChange={e => setDrone(e.target.value)} required />
        <select value={iff} onChange={e => setIff(e.target.value)}>
          <option value="friend">Friend</option>
          <option value="foe">Foe</option>
        </select>
        <button type="submit">Tag</button>
      </form>
      {message && <div style={{ marginTop: 10, color: 'green' }}>{message}</div>}
    </div>
  );
};

export default IFFPortal; 