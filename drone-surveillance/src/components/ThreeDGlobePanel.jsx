import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Add pulsing CSS to the document head once
if (!document.getElementById('threat-pulse-style')) {
  const style = document.createElement('style');
  style.id = 'threat-pulse-style';
  style.innerHTML = `
    .threat-pulse-outer {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px;
      background: transparent;
    }
    .threat-pulse {
      width: 22px; height: 22px; border-radius: 50%; background: #ff4444;
      box-shadow: 0 0 16px 6px #ff4444cc, 0 0 2px #fff;
      opacity: 0.92; border: 2.5px solid #fff;
      position: relative;
      animation: threatPulse 1.2s infinite alternate;
    }
    @keyframes threatPulse {
      0% { box-shadow: 0 0 16px 6px #ff4444cc, 0 0 2px #fff; opacity: 0.92; }
      100% { box-shadow: 0 0 32px 16px #ff4444cc, 0 0 2px #fff; opacity: 1; }
    }
    @media (max-width: 600px) {
      .responsive-map-panel {
        height: 54vw !important;
        min-height: 220px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// Helper to fit map to all markers
function FitBounds({ drones, threats }) {
  const map = useMap();
  React.useEffect(() => {
    const all = [...(drones || []), ...(threats || [])];
    if (all.length > 0) {
      const bounds = all.map(obj => [obj.y || 0, obj.x || 0]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [drones, threats, map]);
  return null;
}

const iconDrone = L.icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6f0.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Custom pulsing red spot icon for threats
const iconThreat = L.divIcon({
  className: '', // No outer class, use html for structure
  html: `<div class='threat-pulse-outer'><div class='threat-pulse'></div></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// India and surrounding region bounding box
const isInIndiaRegion = (lat, lon) => lat >= 5 && lat <= 40 && lon >= 65 && lon <= 100;

const ThreeDGlobePanel = ({ drones, threats, focusedDrone, onMarkerClick }) => {
  // Default center (India)
  const center = [20.5937, 78.9629];
  // Filter drones/threats to India region
  const filteredDrones = (drones || []).filter(d => isInIndiaRegion(d.latitude || d.y || 0, d.longitude || d.x || 0));
  const filteredThreats = (threats || []).filter(t => isInIndiaRegion(t.y || 0, t.x || 0));
  return (
    <div className="responsive-map-panel" style={{ width: '100%', height: 'min(60vw, 420px)', minHeight: 320, borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 24px #00bcd4cc', position: 'relative' }}>
      <MapContainer center={center} zoom={5} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <FitBounds drones={filteredDrones} threats={filteredThreats} />
        {filteredDrones.map(drone => (
          <Marker
            key={drone.id}
            position={[drone.latitude || drone.y || 0, drone.longitude || drone.x || 0]}
            icon={iconDrone}
            eventHandlers={{ click: () => onMarkerClick && onMarkerClick(drone) }}
          >
            <Popup>
              <b>{drone.name}</b><br />
              Type: {drone.type}<br />
              Battery: {drone.battery?.toFixed(1)}%<br />
              Status: {drone.status}
            </Popup>
          </Marker>
        ))}
        {filteredThreats.map((threat, i) => (
          <Marker
            key={i}
            position={[threat.y || 0, threat.x || 0]}
            icon={iconThreat}
            eventHandlers={{ click: () => onMarkerClick && onMarkerClick(threat) }}
          >
            <Popup>
              <b>{threat.type}</b><br />
              {threat.confidence && <>Confidence: {threat.confidence}%<br /></>}
              {threat.distance && <>Distance: {threat.distance} km<br /></>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ThreeDGlobePanel; 