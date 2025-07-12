import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useEffect } from 'react';

// Simple procedural heightmap function
function generateHeight(x, y) {
  return (
    Math.sin(x * 0.2) * Math.cos(y * 0.2) * 4 +
    Math.sin(x * 0.5) * 2 +
    Math.cos(y * 0.3) * 2
  );
}

function TerrainMesh({ width = 60, depth = 60, segments = 64 }) {
  const vertices = [];
  const indices = [];
  // Generate vertices
  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const x = (i / segments - 0.5) * width;
      const y = (j / segments - 0.5) * depth;
      const z = generateHeight(x, y);
      vertices.push(x, z, y);
    }
  }
  // Generate indices
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + 1;
      const c = a + (segments + 1);
      const d = c + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }
  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={vertices.length / 3}
          array={new Float32Array(vertices)}
          itemSize={3}
        />
        <bufferAttribute
          attach="index"
          count={indices.length}
          array={new Uint32Array(indices)}
          itemSize={1}
        />
      </bufferGeometry>
      <meshStandardMaterial color="#6cbb3c" wireframe={false} flatShading={true} />
    </mesh>
  );
}

function IndiaOverlay({ width = 60, depth = 60 }) {
  // SVG path for the Indian subcontinent (simplified, public domain)
  // This is a rough outline for demo purposes
  return (
    <Html center position={[0, 7, 0]} style={{ pointerEvents: 'none' }}>
      <svg width={width * 8} height={depth * 8} viewBox="0 0 600 600" style={{ opacity: 0.35 }}>
        <path
          d="M 300 100 L 340 120 L 370 200 L 350 300 L 400 400 L 370 480 L 320 500 L 300 480 L 270 500 L 230 480 L 200 400 L 250 300 L 230 200 L 260 120 Z"
          fill="none"
          stroke="#00bcd4"
          strokeWidth="8"
        />
        {/* For a more accurate map, replace the path above with a detailed SVG path of India */}
      </svg>
    </Html>
  );
}

function DetectionMarkers({ detections, width = 60, depth = 60, focusedDrone, onMarkerClick }) {
  const [tooltip, setTooltip] = useState(null); // {x, y, info}
  const colorMap = {
    human: 'orange',
    helicopter: 'deepskyblue',
    landmine: 'red',
    airdefense: '#8e44ad',
    radar: '#00e676',
    missile: '#ffeb3b',
  };
  const labelMap = {
    human: 'Human',
    helicopter: 'Helicopter',
    landmine: 'Landmine',
    airdefense: 'Air Defense',
    radar: 'Radar',
    missile: 'Missile',
  };
  return (
    <>
      {detections && detections.map((det, i) => {
        // Map normalized x/y to terrain coordinates
        const px = (det.x - 0.5) * width;
        const py = (det.y - 0.5) * depth;
        const pz = generateHeight(px, py);
        const isFocused = focusedDrone && (det.id === focusedDrone.id || det.name === focusedDrone.name);
        return (
          <group key={i} position={[px, pz + 2.5, py]}>
            {/* Glow effect: slightly larger, semi-transparent sphere */}
            <mesh>
              <sphereGeometry args={[isFocused ? 3.2 : 2.2, 24, 24]} />
              <meshStandardMaterial color={isFocused ? '#ffd600' : (colorMap[det.type] || 'yellow')} transparent opacity={isFocused ? 0.6 : 0.3} emissive={isFocused ? '#ffd600' : (colorMap[det.type] || 'yellow')} emissiveIntensity={isFocused ? 1.2 : 0.7} />
            </mesh>
            {/* Main marker */}
            <mesh
              onClick={e => {
                e.stopPropagation();
                setTooltip({ x: px, y: py, z: pz + 5, info: det });
                if (onMarkerClick) onMarkerClick(det);
              }}
              style={{ cursor: 'pointer' }}
            >
              <sphereGeometry args={[isFocused ? 2.7 : 1.7, 24, 24]} />
              <meshStandardMaterial color={isFocused ? '#ffd600' : (colorMap[det.type] || 'yellow')} emissive={isFocused ? '#ffd600' : (colorMap[det.type] || 'yellow')} emissiveIntensity={isFocused ? 1.5 : 0.9} />
            </mesh>
            {/* Label above marker */}
            <Html center position={[0, isFocused ? 4 : 2.5, 0]} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: isFocused ? '#ffd600cc' : '#222c',
                color: isFocused ? '#222' : (colorMap[det.type] || '#fff'),
                fontWeight: 700,
                fontSize: isFocused ? 18 : 16,
                padding: isFocused ? '4px 16px' : '2px 10px',
                borderRadius: 8,
                border: `2px solid ${isFocused ? '#ffd600' : (colorMap[det.type] || '#fff')}`,
                boxShadow: '0 2px 12px #000a',
                marginBottom: 2,
                whiteSpace: 'nowrap',
              }}>{labelMap[det.type] || det.type}{isFocused ? ' (Focused)' : ''}</div>
            </Html>
            {/* Tooltip on click */}
            {tooltip && tooltip.info === det && (
              <Html center position={[0, 6, 0]} style={{ pointerEvents: 'auto', zIndex: 200 }}>
                <div style={{
                  background: '#fff',
                  color: '#222',
                  borderRadius: 10,
                  boxShadow: '0 2px 16px #000a',
                  padding: '14px 22px',
                  minWidth: 180,
                  fontWeight: 600,
                  fontSize: 15,
                  border: '2px solid #ffd600',
                  position: 'relative',
                }}>
                  <div style={{marginBottom:6}}><b>{det.name || labelMap[det.type] || det.type}</b></div>
                  {det.group && <div>Group: {det.group}</div>}
                  {det.isSuperHead && <div style={{color:'#ffd600'}}>★ Super Head</div>}
                  {!det.isSuperHead && det.isHead && <div style={{color:'#00bcd4'}}>● Head</div>}
                  <div>Type: {labelMap[det.type] || det.type}</div>
                  {det.status && <div>Status: {det.status}</div>}
                  {det.battery && <div>Battery: {det.battery}%</div>}
                  {det.altitude && <div>Altitude: {det.altitude} m</div>}
                  {det.speed && <div>Speed: {det.speed} km/h</div>}
                  {det.threatLevel && <div>Threat: {det.threatLevel}</div>}
                  <button onClick={() => setTooltip(null)} style={{marginTop:10,padding:'4px 12px',background:'#ffd600',color:'#222',border:'none',borderRadius:6,fontWeight:700,cursor:'pointer'}}>Close</button>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}

function PredictionHeatmap({ predictions, width = 60, depth = 60 }) {
  // Render heatmap overlays and animated paths for predictions
  return (
    <group>
      {predictions && predictions.map((pred, i) => {
        // Heatmap: draw a semi-transparent colored disc or area
        if (pred.heatmap) {
          return (
            <mesh key={`heatmap-${i}`} position={[(pred.x - 0.5) * width, 6.5, (pred.y - 0.5) * depth]}>
              <circleGeometry args={[pred.radius || 7, 32]} />
              <meshBasicMaterial color={pred.color || '#ff4444'} transparent opacity={0.25} />
            </mesh>
          );
        }
        // Animated path: draw a line with moving marker
        if (pred.path && Array.isArray(pred.path) && pred.path.length > 1) {
          return <AnimatedPredictionPath key={`path-${i}`} path={pred.path} color={pred.color || '#00d4ff'} label={pred.label || pred.type} width={width} depth={depth} />;
        }
        return null;
      })}
    </group>
  );
}

function AnimatedPredictionPath({ path, color, label, width, depth }) {
  // Animate a marker along the path
  const lineRef = useRef();
  const markerRef = useRef();
  const progress = useRef(0);
  useFrame((state, delta) => {
    progress.current += delta * 0.15; // speed
    if (progress.current > path.length - 1) progress.current = 0;
    const idx = Math.floor(progress.current);
    const frac = progress.current - idx;
    if (markerRef.current && path[idx + 1]) {
      const x = (path[idx][0] * width - width / 2) * (1 - frac) + (path[idx + 1][0] * width - width / 2) * frac;
      const y = (path[idx][1] * depth - depth / 2) * (1 - frac) + (path[idx + 1][1] * depth - depth / 2) * frac;
      const z = generateHeight(x, y);
      markerRef.current.position.set(x, z + 7, y);
    }
  });
  // Build line geometry
  const points = path.map(([nx, ny]) => [nx * width - width / 2, generateHeight(nx * width - width / 2, ny * depth - depth / 2) + 7, ny * depth - depth / 2]);
  return (
    <group>
      <line ref={lineRef}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            count={points.length}
            array={new Float32Array(points.flat())}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={3} />
      </line>
      {/* Animated marker */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      {/* Label at start */}
      <Html center position={[points[0][0], points[0][1] + 4, points[0][2]]} style={{ pointerEvents: 'none' }}>
        <div style={{background:'#111c',color:color,fontWeight:700,fontSize:15,padding:'2px 10px',borderRadius:8,border:`2px solid ${color}`,boxShadow:'0 2px 8px #000a',marginBottom:2,whiteSpace:'nowrap'}}>{label}</div>
      </Html>
    </group>
  );
}

export default function ThreeDTerrainMap({ detections = [], style, indiaOverlay = false, mini = false, focusedDrone, onMarkerClick, predictions = [] }) {
  return (
    <div style={{ width: mini ? 260 : '100%', height: mini ? 220 : 400, background: '#222', borderRadius: 12, ...style }}>
      <Canvas camera={{ position: [0, 30, 60], fov: 50 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[30, 50, 30]} intensity={1.2} castShadow />
        <Suspense fallback={null}>
          <TerrainMesh />
          <DetectionMarkers detections={detections} focusedDrone={focusedDrone} onMarkerClick={onMarkerClick} />
          <PredictionHeatmap predictions={predictions} />
          {indiaOverlay && <IndiaOverlay />}
        </Suspense>
        <OrbitControls enablePan enableZoom enableRotate />
        {mini ? null : <Stats />}
      </Canvas>
    </div>
  );
} 