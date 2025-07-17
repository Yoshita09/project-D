import React, { useState } from 'react';
import { describeImage } from '../api/aiDetection';

const AIDescriptionUpload = () => {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [descLoading, setDescLoading] = useState(false);
  const [descError, setDescError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDescription('');
    setDescError('');
  };

  const handleDetect = async () => {
    if (!file) return;
    setDescLoading(true);
    setDescription('');
    setDescError('');
    try {
      const result = await describeImage(file);
      setDescription(result.description);
    } catch (e) {
      setDescError('Error: ' + e.message);
    }
    setDescLoading(false);
  };

  return (
    <div style={{ background: '#10141a', borderRadius: 12, padding: 24, maxWidth: 400, margin: '32px auto', boxShadow: '0 2px 16px #0004' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{ background: '#1976d2', color: '#fff', padding: '6px 18px', borderRadius: 8, fontWeight: 700, fontSize: 18, position: 'relative', top: -22 }}>AI Detection</span>
      </div>
      <input type="file" accept="image/*" onChange={handleFileChange} style={{ width: '100%', marginBottom: 18, background: '#181818', color: '#fff', borderRadius: 6, padding: 8 }} />
      <button
        onClick={handleDetect}
        disabled={!file || descLoading}
        style={{ width: '100%', padding: '14px 0', borderRadius: 10, background: !file ? '#444' : '#1976d2', color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', cursor: !file ? 'not-allowed' : 'pointer', marginBottom: 12, transition: 'background 0.2s' }}
      >
        {descLoading ? 'Analyzing...' : 'Upload & Detect'}
      </button>
      {descError && <div style={{ color: 'red', marginTop: 8, textAlign: 'center' }}>{descError}</div>}
      {description && (
        <div style={{ marginTop: 20, color: '#00d4ff', fontWeight: 'bold', textAlign: 'center', fontSize: 17, background: '#181f2a', borderRadius: 8, padding: 16 }}>
          {description}
        </div>
      )}
    </div>
  );
};

export default AIDescriptionUpload; 