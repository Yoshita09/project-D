import React, { useRef, useEffect, useState } from 'react';
import droneVideo from '../assets/drone_video.mp4';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const BOX_COLOR = 'rgba(0, 255, 0, 0.5)';
const HELICOPTER_COLOR = 'rgba(0, 128, 255, 0.5)';
const LANDMINE_COLOR = 'rgba(255, 0, 0, 0.5)';
const DETECTION_THRESHOLD = 0.3;
const MIN_BOX_SIZE = 40;
const TANK_COLOR = 'rgba(255, 165, 0, 0.5)';
const SOLDIER_COLOR = 'rgba(0, 255, 255, 0.5)';
const AIRCRAFT_COLOR = 'rgba(255, 255, 0, 0.5)';

const COMMAND_ALERT_STYLE = {
  position: 'absolute',
  top: 80,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#ff4444',
  color: '#fff',
  padding: '12px 28px',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 18,
  boxShadow: '0 2px 16px #ff4444aa',
  zIndex: 30,
  border: '2px solid #fff',
  animation: 'pulse 1.2s infinite',
  display: 'flex',
  alignItems: 'center',
  gap: 12
};

const VideoDetectionSimulator = ({ onHumanCountChange, onDetections }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoDims, setVideoDims] = useState({ width: 640, height: 360 });
  const [model, setModel] = useState(null);
  const [humanCount, setHumanCount] = useState(0);
  const [videoQualityWarning, setVideoQualityWarning] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [simulateHelicopter, setSimulateHelicopter] = useState(false);
  const [simulateLandmine, setSimulateLandmine] = useState(false);
  const [simulateAirDefense, setSimulateAirDefense] = useState(false);
  const [simulateRadar, setSimulateRadar] = useState(false);
  const [simulateMissile, setSimulateMissile] = useState(false);
  const [simulateTank, setSimulateTank] = useState(false);
  const [simulateSoldier, setSimulateSoldier] = useState(false);
  const [simulateAircraft, setSimulateAircraft] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [autoDetections, setAutoDetections] = useState([]); // [{type, x, y, expiresAt}]
  const [showLandmineAlert, setShowLandmineAlert] = useState(false);

  // Load COCO-SSD model
  useEffect(() => {
    cocoSsd.load().then(setModel);
  }, []);

  // Handle switching between video file and camera
  useEffect(() => {
    const video = videoRef.current;
    if (useCamera) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          setMediaStream(stream);
          if (video) {
            video.srcObject = stream;
            video.play();
            setCameraActive(true);
          }
        })
        .catch(() => {
          setCameraActive(false);
          setUseCamera(false);
          alert('Could not access camera.');
        });
    } else {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      if (video) {
        video.srcObject = null;
        video.load();
        setCameraActive(false);
      }
    }
    // Cleanup on unmount
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line
  }, [useCamera]);

  // Update canvas size to match video
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const updateDims = () => {
        setVideoDims({ width: video.videoWidth || 640, height: video.videoHeight || 360 });
      };
      video.addEventListener('loadedmetadata', updateDims);
      return () => video.removeEventListener('loadedmetadata', updateDims);
    }
  }, []);

  // Run detection and draw overlays
  useEffect(() => {
    if (!model) return;
    let animationId;
    let detectionIntervalId;
    let lastPredictions = [];
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');

    setVideoQualityWarning(video.videoWidth < 400 || video.videoHeight < 400);

    // Draw overlays (runs every animation frame)
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let count = 0;
      // Build detections array for 3D map
      const detectionsFor3D = [];
      lastPredictions.forEach(pred => {
        if (
          pred.class === 'person' &&
          pred.score > DETECTION_THRESHOLD &&
          pred.bbox[2] >= MIN_BOX_SIZE &&
          pred.bbox[3] >= MIN_BOX_SIZE
        ) {
          ctx.strokeStyle = BOX_COLOR;
          ctx.lineWidth = 3;
          ctx.strokeRect(...pred.bbox);
          ctx.fillStyle = BOX_COLOR;
          ctx.font = '18px Arial';
          ctx.fillText('Human', pred.bbox[0] + 4, pred.bbox[1] - 8);
          count++;
          // Add to 3D detections
          const cx = (pred.bbox[0] + pred.bbox[2] / 2) / videoDims.width;
          const cy = (pred.bbox[1] + pred.bbox[3] / 2) / videoDims.height;
          detectionsFor3D.push({ type: 'human', x: cx, y: cy });
        }
      });
      // Draw auto detections
      autoDetections.forEach(det => {
        let color, label;
        switch (det.type) {
          case 'human':
            color = det.uncertain ? '#ff9800' : BOX_COLOR; label = det.uncertain ? 'Possible Human?' : 'Human'; break;
          case 'helicopter':
            color = det.uncertain ? '#ff9800' : HELICOPTER_COLOR; label = det.uncertain ? 'Possible Helicopter?' : 'Helicopter'; break;
          case 'landmine':
            color = det.uncertain ? '#ff9800' : LANDMINE_COLOR; label = det.uncertain ? 'Possible Landmine?' : 'Landmine'; break;
          case 'airdefense':
            color = det.uncertain ? '#ff9800' : '#8e44ad'; label = det.uncertain ? 'Possible Air Defense?' : 'Air Defense'; break;
          case 'radar':
            color = det.uncertain ? '#ff9800' : '#00e676'; label = det.uncertain ? 'Possible Radar?' : 'Radar'; break;
          case 'missile':
            color = det.uncertain ? '#ffeb3b' : '#ffeb3b'; label = det.uncertain ? 'Possible Missile?' : 'Missile'; break;
          default:
            color = det.uncertain ? '#ff9800' : 'yellow'; label = det.uncertain ? `Possible ${det.type}?` : det.type;
        }
        // Randomize box shape for realism
        let w = det.size, h = det.size;
        if (det.type === 'missile') h = det.size * 1.5;
        if (det.type === 'helicopter') w = det.size * 1.5;
        const boxX = det.x * videoDims.width - w / 2;
        const boxY = det.y * videoDims.height - h / 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, w, h);
        ctx.fillStyle = color;
        ctx.font = '18px Arial';
        ctx.fillText(label, boxX + 4, boxY - 8);
        detectionsFor3D.push({ type: det.type, x: det.x, y: det.y, uncertain: det.uncertain });
      });
      // Simulate helicopter detection
      if (simulateHelicopter) {
        ctx.strokeStyle = HELICOPTER_COLOR;
        ctx.lineWidth = 3;
        ctx.strokeRect(60, 40, 120, 60);
        ctx.fillStyle = HELICOPTER_COLOR;
        ctx.font = '18px Arial';
        ctx.fillText('Helicopter', 64, 32);
        detectionsFor3D.push({ type: 'helicopter', x: 0.2, y: 0.1 });
      }
      // Simulate landmine detection
      if (simulateLandmine) {
        ctx.strokeStyle = LANDMINE_COLOR;
        ctx.lineWidth = 3;
        ctx.strokeRect(300, 220, 40, 40);
        ctx.fillStyle = LANDMINE_COLOR;
        ctx.font = '18px Arial';
        ctx.fillText('Landmine', 304, 212);
        detectionsFor3D.push({ type: 'landmine', x: 0.7, y: 0.7 });
      }
      // Simulate air defense detection
      if (simulateAirDefense) {
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 3;
        ctx.strokeRect(180, 80, 70, 70);
        ctx.fillStyle = '#8e44ad';
        ctx.font = '18px Arial';
        ctx.fillText('Air Defense', 184, 72);
        detectionsFor3D.push({ type: 'airdefense', x: 0.35, y: 0.22 });
      }
      // Simulate radar detection
      if (simulateRadar) {
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 3;
        ctx.strokeRect(420, 100, 60, 60);
        ctx.fillStyle = '#00e676';
        ctx.font = '18px Arial';
        ctx.fillText('Radar', 424, 92);
        detectionsFor3D.push({ type: 'radar', x: 0.8, y: 0.25 });
      }
      // Simulate missile detection
      if (simulateMissile) {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 3;
        ctx.strokeRect(500, 300, 50, 80);
        ctx.fillStyle = '#ffeb3b';
        ctx.font = '18px Arial';
        ctx.fillText('Missile', 504, 292);
        detectionsFor3D.push({ type: 'missile', x: 0.9, y: 0.85 });
      }
      // Simulate tank detection
      if (simulateTank) {
        ctx.strokeStyle = TANK_COLOR;
        ctx.lineWidth = 3;
        ctx.strokeRect(200, 150, 100, 60);
        ctx.fillStyle = TANK_COLOR;
        ctx.font = '18px Arial';
        ctx.fillText('Tank', 204, 142);
        detectionsFor3D.push({ type: 'tank', x: 0.4, y: 0.45 });
      }
      // Simulate soldier detection
      if (simulateSoldier) {
        ctx.strokeStyle = SOLDIER_COLOR;
        ctx.lineWidth = 3;
        ctx.strokeRect(350, 100, 40, 80);
        ctx.fillStyle = SOLDIER_COLOR;
        ctx.font = '18px Arial';
        ctx.fillText('Soldier', 354, 92);
        detectionsFor3D.push({ type: 'soldier', x: 0.6, y: 0.3 });
      }
      // Simulate aircraft detection
      if (simulateAircraft) {
        ctx.strokeStyle = AIRCRAFT_COLOR;
        ctx.lineWidth = 3;
        ctx.strokeRect(100, 40, 120, 50);
        ctx.fillStyle = AIRCRAFT_COLOR;
        ctx.font = '18px Arial';
        ctx.fillText('Aircraft', 104, 32);
        detectionsFor3D.push({ type: 'aircraft', x: 0.2, y: 0.1 });
      }
      // Terrain anomaly scan effect for landmines
      if (simulateLandmine) {
        // Draw a low-altitude scan overlay
        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
        ctx.globalAlpha = 1;
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('TERRAIN SCAN: Anomaly Detected', 18, canvas.height - 90);
        ctx.restore();
        // Simulate multiple landmine detections
        const mineBoxes = [
          { x: 120, y: canvas.height - 60, w: 44, h: 44 },
          { x: 260, y: canvas.height - 50, w: 38, h: 38 },
          { x: 400, y: canvas.height - 70, w: 50, h: 50 }
        ];
        mineBoxes.forEach((box, i) => {
          ctx.save();
          ctx.strokeStyle = LANDMINE_COLOR;
          ctx.lineWidth = 4;
          ctx.strokeRect(box.x, box.y, box.w, box.h);
          ctx.font = 'bold 18px Arial';
          ctx.fillStyle = '#ff4444';
          ctx.fillText('⚠️', box.x + box.w/2 - 10, box.y + box.h/2 + 8);
          ctx.font = 'bold 13px Arial';
          ctx.fillStyle = '#fff';
          ctx.fillText('Landmine', box.x + 2, box.y - 8);
          ctx.restore();
          detectionsFor3D.push({ type: 'landmine', x: (box.x + box.w/2) / videoDims.width, y: (box.y + box.h/2) / videoDims.height });
        });
        // Show command center alert
        if (!showLandmineAlert) {
          setShowLandmineAlert(true);
          setTimeout(() => setShowLandmineAlert(false), 3500);
        }
      }
      setHumanCount(count);
      if (onHumanCountChange) onHumanCountChange(count);
      // Send detections to parent for 3D map
      if (typeof onDetections === 'function') onDetections(detectionsFor3D);
      // Show alert if more than 3 humans detected
      if (count > 3) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(0, 0, canvas.width, 40);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('ALERT: Multiple Humans Detected!', 16, 30);
        ctx.restore();
      }
      // Draw human count at bottom left
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#222';
      ctx.fillRect(0, canvas.height - 38, 220, 38);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`Detected Humans: ${count}`, 12, canvas.height - 14);
      ctx.restore();
      animationId = requestAnimationFrame(draw);
    };

    // Run detection at a fixed interval (e.g., every 100ms)
    const runDetection = async () => {
      if (model && !video.paused && !video.ended) {
        const predictions = await model.detect(video);
        lastPredictions = predictions;
      }
    };
    detectionIntervalId = setInterval(runDetection, 150); // 150ms interval
    draw();
    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(detectionIntervalId);
    };
  }, [model, videoDims, useCamera, onHumanCountChange, simulateHelicopter, simulateLandmine, simulateTank, simulateSoldier, simulateAircraft, onDetections, autoDetections, showLandmineAlert]);

  // Enhanced auto scan effect
  useEffect(() => {
    if (!autoScan) return;
    let timeoutId;
    const threatTypes = [
      { type: 'human', weight: 32, minDur: 1200, maxDur: 2200, minSize: 48, maxSize: 80 },
      { type: 'landmine', weight: 24, minDur: 1200, maxDur: 2200, minSize: 32, maxSize: 48 },
      { type: 'helicopter', weight: 12, minDur: 1800, maxDur: 2600, minSize: 80, maxSize: 140 },
      { type: 'radar', weight: 8, minDur: 1800, maxDur: 2600, minSize: 48, maxSize: 70 },
      { type: 'airdefense', weight: 6, minDur: 2800, maxDur: 4200, minSize: 60, maxSize: 90 },
      { type: 'missile', weight: 4, minDur: 3200, maxDur: 5000, minSize: 60, maxSize: 120 },
    ];
    const totalWeight = threatTypes.reduce((sum, t) => sum + t.weight, 0);
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    const pickThreat = () => {
      let r = Math.random() * totalWeight;
      for (const t of threatTypes) {
        if (r < t.weight) return t;
        r -= t.weight;
      }
      return threatTypes[0];
    };
    const maybeFalseAlarm = () => Math.random() < 0.08; // 8% chance
    const maybeCluster = () => Math.random() < 0.18; // 18% chance for cluster
    const addAutoDetection = () => {
      const detections = [];
      // Cluster logic
      const cluster = maybeCluster();
      const n = cluster ? Math.floor(randomInRange(2, 4)) : 1;
      const baseX = randomInRange(0.15, 0.85);
      const baseY = randomInRange(0.15, 0.85);
      for (let i = 0; i < n; ++i) {
        const t = pickThreat();
        const x = cluster ? baseX + randomInRange(-0.06, 0.06) : randomInRange(0.1, 0.9);
        const y = cluster ? baseY + randomInRange(-0.06, 0.06) : randomInRange(0.1, 0.9);
        const size = randomInRange(t.minSize, t.maxSize);
        const duration = randomInRange(t.minDur, t.maxDur);
        const uncertain = maybeFalseAlarm();
        detections.push({
          type: t.type,
          x: Math.max(0.08, Math.min(0.92, x)),
          y: Math.max(0.08, Math.min(0.92, y)),
          size,
          expiresAt: Date.now() + duration,
          uncertain,
        });
      }
      setAutoDetections(prev => [...prev, ...detections]);
      // Schedule next detection
      timeoutId = setTimeout(addAutoDetection, randomInRange(1400, 3200));
    };
    addAutoDetection();
    return () => clearTimeout(timeoutId);
  }, [autoScan]);
  // Cleanup expired auto detections
  useEffect(() => {
    if (!autoScan) return;
    const interval = setInterval(() => {
      setAutoDetections(prev => prev.filter(d => d.expiresAt > Date.now()));
    }, 500);
    return () => clearInterval(interval);
  }, [autoScan]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: videoDims.width, height: 'auto', margin: '0 auto' }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setUseCamera(c => !c)}
          style={{ padding: '8px 16px', borderRadius: 6, background: useCamera ? '#1976d2' : '#555', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {useCamera ? 'Use Drone Video' : 'Use Live Camera'}
        </button>
        <button
          onClick={() => setSimulateHelicopter(v => !v)}
          style={{ padding: '8px 12px', borderRadius: 6, background: simulateHelicopter ? '#0288d1' : '#888', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {simulateHelicopter ? 'Hide Helicopter' : 'Simulate Helicopter'}
        </button>
        <button
          onClick={() => setSimulateLandmine(v => !v)}
          style={{ padding: '8px 12px', borderRadius: 6, background: simulateLandmine ? '#d32f2f' : '#888', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {simulateLandmine ? 'Hide Landmine' : 'Simulate Landmine'}
        </button>
        <button
          onClick={() => setSimulateAirDefense(v => !v)}
          style={{ padding: '8px 12px', borderRadius: 6, background: simulateAirDefense ? '#8e44ad' : '#888', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {simulateAirDefense ? 'Hide Air Defense' : 'Simulate Air Defense'}
        </button>
        <button
          onClick={() => setSimulateRadar(v => !v)}
          style={{ padding: '8px 12px', borderRadius: 6, background: simulateRadar ? '#00e676' : '#888', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {simulateRadar ? 'Hide Radar' : 'Simulate Radar'}
        </button>
        <button
          onClick={() => setSimulateMissile(v => !v)}
          style={{ padding: '8px 12px', borderRadius: 6, background: simulateMissile ? '#ffeb3b' : '#888', color: '#222', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {simulateMissile ? 'Hide Missile' : 'Simulate Missile'}
        </button>
        <button
          onClick={() => setSimulateTank(v => !v)}
          style={{ padding: '8px 12px', borderRadius: 6, background: simulateTank ? '#ffa500' : '#888', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {simulateTank ? 'Hide Tank' : 'Simulate Tank'}
        </button>
        <button
          onClick={() => setSimulateSoldier(v => !v)}
          style={{ padding: '8px 12px', borderRadius: 6, background: simulateSoldier ? '#00ffff' : '#888', color: '#222', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {simulateSoldier ? 'Hide Soldier' : 'Simulate Soldier'}
        </button>
        <button
          onClick={() => setSimulateAircraft(v => !v)}
          style={{ padding: '8px 12px', borderRadius: 6, background: simulateAircraft ? '#ffff00' : '#888', color: '#222', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {simulateAircraft ? 'Hide Aircraft' : 'Simulate Aircraft'}
        </button>
        <button
          onClick={() => setAutoScan(v => !v)}
          style={{ padding: '8px 12px', borderRadius: 6, background: autoScan ? '#43a047' : '#888', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {autoScan ? 'Stop Auto Scan' : 'Auto Scan'}
        </button>
        {useCamera && !cameraActive && (
          <span style={{ color: '#ff4444', marginLeft: 12 }}>Camera not available</span>
        )}
      </div>
      <video
        ref={videoRef}
        src={useCamera ? undefined : droneVideo}
        width={videoDims.width}
        height={videoDims.height}
        controls={!useCamera}
        autoPlay={useCamera}
        muted={useCamera}
        style={{ display: 'block', width: '100%', height: 'auto', background: '#000', maxWidth: '100%' }}
      />
      <canvas
        ref={canvasRef}
        width={videoDims.width}
        height={videoDims.height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%' }}
      />
      {!model && <div style={{position:'absolute',top:10,left:10,background:'#fff8',padding:'8px',borderRadius:'6px'}}>Loading AI model...</div>}
      {videoQualityWarning && (
        <div style={{position:'absolute',top:60,left:10,background:'#ffecb3',color:'#222',padding:'8px 16px',borderRadius:'6px',fontWeight:'bold',zIndex:10}}>
          Warning: Video quality is low. Detection accuracy may be reduced.
        </div>
      )}
      {showLandmineAlert && (
        <div style={COMMAND_ALERT_STYLE}>
          <span style={{fontSize:28}}>⚠️</span>
          <span>Command Center Alert: Landmines Detected!</span>
        </div>
      )}
    </div>
  );
};

// Responsive styles for the video detection simulator
const style = document.createElement('style');
style.innerHTML = `
@media (max-width: 900px) {
  .right-panel {
    min-width: 0 !important;
    padding: 0.5rem !important;
  }
}
@media (max-width: 600px) {
  .right-panel {
    min-width: 0 !important;
    padding: 0.25rem !important;
  }
  .right-panel h3 {
    font-size: 1.1rem;
  }
  .right-panel > div {
    font-size: 0.9rem;
  }
}
`;
document.head.appendChild(style);

export default VideoDetectionSimulator; 