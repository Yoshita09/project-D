import React, { useEffect, useState } from 'react';

const OTAManagementPortal = () => {
  const [drones, setDrones] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/ota/list')
      .then(res => res.json())
      .then(data => setDrones(data.drones || []));
  }, []);

  const uploadFile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('http://localhost:5000/api/ota/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    setMessage(data.success ? 'File uploaded!' : 'Failed to upload');
  };

  const triggerUpdate = async (drone) => {
    const res = await fetch('http://localhost:5000/api/ota/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ droneId: drone })
    });
    const data = await res.json();
    setMessage(data.success ? 'OTA update triggered!' : 'Failed to update');
  };

  const rollback = async (drone) => {
    const res = await fetch('http://localhost:5000/api/ota/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ droneId: drone })
    });
    const data = await res.json();
    setMessage(data.success ? 'Rollback triggered!' : 'Failed to rollback');
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>OTA + Model/Firmware Management</h2>
      <h3>Current Drones</h3>
      <ul>
        {drones.map(d => (
          <li key={d.name}>{d.name}: Firmware {d.firmware}, Model {d.model}
            <button onClick={() => triggerUpdate(d.name)} style={{ marginLeft: 10 }}>OTA Update</button>
            <button onClick={() => rollback(d.name)} style={{ marginLeft: 5 }}>Rollback</button>
          </li>
        ))}
      </ul>
      <form onSubmit={uploadFile} style={{ marginTop: 20 }}>
        <h4>Upload Model/Firmware</h4>
        <input type="file" onChange={e => setFile(e.target.files[0])} required />
        <button type="submit">Upload</button>
      </form>
      {message && <div style={{ marginTop: 10, color: 'green' }}>{message}</div>}
    </div>
  );
};

export default OTAManagementPortal; 