import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Default drone icon (can be customized)
const droneIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const RealTimeMap = ({ drones }) => {
  // Center the map on the first drone, or a default location
  const center = drones && drones.length > 0
    ? [drones[0].location.lat, drones[0].location.lng]
    : [28.6139, 77.2090]; // Default: New Delhi

  return (
    <div style={{ width: '100%', height: '400px', maxWidth: 800, margin: '0 auto' }}>
      <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {drones.map(drone => (
          <Marker
            key={drone.id}
            position={[drone.location.lat, drone.location.lng]}
            icon={droneIcon}
          >
            <Popup>
              <b>{drone.name}</b><br />
              Type: {drone.type}<br />
              Battery: {drone.battery}%<br />
              Altitude: {drone.altitude}m
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default RealTimeMap; 