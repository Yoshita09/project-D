import React from 'react';

const SwarmVisualizerPortal = () => {
  // Mock data for demo
  const strategy = 'Aggressive Search & Destroy';
  const decisions = [
    { drone: 'pinaka-1', decision: 'Engage target at (28.61, 77.20)' },
    { drone: 'pinaka-2', decision: 'Patrol perimeter' },
  ];
  const goals = [
    'Eliminate threats in Zone A',
    'Maintain formation',
    'Minimize civilian exposure',
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Swarm AI Brain Visualizer</h2>
      <h4>Current Swarm Strategy</h4>
      <div>{strategy}</div>
      <h4>Drone-wise Decisions</h4>
      <ul>
        {decisions.map((d, i) => (
          <li key={i}>{d.drone}: {d.decision}</li>
        ))}
      </ul>
      <h4>Collective Goals</h4>
      <ul>
        {goals.map((g, i) => (
          <li key={i}>{g}</li>
        ))}
      </ul>
    </div>
  );
};

export default SwarmVisualizerPortal; 