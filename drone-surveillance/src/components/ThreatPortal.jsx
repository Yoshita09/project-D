import React from 'react';
// import ThreeDTerrainMap from './ThreeDTerrainMap';

const typeColor = {
  human: '#ff9800',
  helicopter: '#2196f3',
  landmine: '#e53935',
};
const typeIcon = {
  human: '🧑',
  helicopter: '🚁',
  landmine: '💣',
};

export default function ThreatPortal({ detections = [] }) {
  return (
    <div style={{ background: '#181c24', borderRadius: 10, padding: 16, marginTop: 16, color: '#fff', minWidth: 260 }}>
      <h3 style={{ color: '#fff', marginBottom: 12, borderBottom: '1px solid #333', paddingBottom: 6 }}>Threat Portal</h3>
      {detections.length === 0 ? (
        <div style={{ color: '#aaa' }}>No threats detected.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {detections.map((det, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 22, marginRight: 10 }}>{typeIcon[det.type] || '❓'}</span>
              <span style={{ color: typeColor[det.type] || '#fff', fontWeight: 600, marginRight: 8 }}>{det.type.charAt(0).toUpperCase() + det.type.slice(1)}</span>
              <span style={{ fontSize: 13, color: '#bbb' }}>({(det.x*100).toFixed(1)}, {(det.y*100).toFixed(1)})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 