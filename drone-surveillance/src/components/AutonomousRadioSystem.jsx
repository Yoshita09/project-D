import React, { useState, useEffect, useCallback, useMemo } from 'react';

const AutonomousRadioSystem = () => {
    // Radio Configuration State
    const [radioConfig, setRadioConfig] = useState({
        frequency: '2.4GHz',
        protocol: 'LoRa',
        topology: 'mesh',
        power: 'high',
        encryption: 'AES-256'
    });

    // System State
    const [isRadioActive, setIsRadioActive] = useState(false);
    const [isAutonomousMode, setIsAutonomousMode] = useState(false);
    const [networkNodes, setNetworkNodes] = useState([]);
    const [signalStrength, setSignalStrength] = useState(85);
    const [dataTransmission, setDataTransmission] = useState({
        sent: 0,
        received: 0,
        errors: 0,
        latency: 12
    });
    const [frequencySpectrum, setFrequencySpectrum] = useState([]);
    const [jammerDetection, setJammerDetection] = useState({
        detected: false,
        frequency: null,
        strength: 0
    });
    const [communicationLog, setCommunicationLog] = useState([]);

    // Initialize network nodes (representing drones in the swarm)
    useEffect(() => {
        const initialNodes = Array.from({ length: 8 }, (_, i) => ({
            id: `drone-${i + 1}`,
            name: `Prithvi-${i + 1}`,
            status: Math.random() > 0.2 ? 'online' : 'offline',
            signalStrength: Math.floor(Math.random() * 40) + 60,
            lastSeen: new Date(Date.now() - Math.random() * 300000),
            role: i === 0 ? 'master' : 'slave',
            batteryLevel: Math.floor(Math.random() * 40) + 60,
            location: {
                lat: 28.6139 + (Math.random() - 0.5) * 0.02,
                lng: 77.2090 + (Math.random() - 0.5) * 0.02
            }
        }));
        setNetworkNodes(initialNodes);
    }, []);

    // Simulate frequency spectrum data
    useEffect(() => {
        const interval = setInterval(() => {
            const spectrum = Array.from({ length: 50 }, (_, i) => ({
                frequency: 2400 + i * 2,
                power: Math.random() * 100,
                occupied: Math.random() > 0.7
            }));
            setFrequencySpectrum(spectrum);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // Simulate real-time data updates
    useEffect(() => {
        if (!isRadioActive) return;

        const interval = setInterval(() => {
            // Update signal strength
            setSignalStrength(prev => Math.max(20, Math.min(100, prev + (Math.random() - 0.5) * 10)));

            // Update data transmission stats
            setDataTransmission(prev => ({
                sent: prev.sent + Math.floor(Math.random() * 50),
                received: prev.received + Math.floor(Math.random() * 45),
                errors: prev.errors + (Math.random() > 0.95 ? 1 : 0),
                latency: Math.max(5, Math.min(50, prev.latency + (Math.random() - 0.5) * 5))
            }));

            // Update node status
            setNetworkNodes(prev => prev.map(node => ({
                ...node,
                signalStrength: Math.max(20, Math.min(100, node.signalStrength + (Math.random() - 0.5) * 8)),
                status: Math.random() > 0.05 ? node.status : (node.status === 'online' ? 'offline' : 'online')
            })));

            // Jammer detection simulation
            if (Math.random() > 0.98) {
                setJammerDetection({
                    detected: true,
                    frequency: 2400 + Math.random() * 100,
                    strength: Math.random() * 100
                });
                setTimeout(() => setJammerDetection({ detected: false, frequency: null, strength: 0 }), 5000);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isRadioActive]);

    const toggleRadioSystem = () => {
        setIsRadioActive(!isRadioActive);
        addLogEntry(isRadioActive ? 'Radio system deactivated' : 'Radio system activated', 'system');
    };

    const toggleAutonomousMode = () => {
        setIsAutonomousMode(!isAutonomousMode);
        addLogEntry(isAutonomousMode ? 'Manual mode activated' : 'Autonomous mode activated', 'system');
    };

    const addLogEntry = (message, type = 'info') => {
        const entry = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            message,
            type
        };
        setCommunicationLog(prev => [entry, ...prev.slice(0, 49)]);
    };

    const handleFrequencyChange = (newFreq) => {
        setRadioConfig(prev => ({ ...prev, frequency: newFreq }));
        addLogEntry(`Frequency changed to ${newFreq}`, 'config');
    };

    const handleProtocolChange = (newProtocol) => {
        setRadioConfig(prev => ({ ...prev, protocol: newProtocol }));
        addLogEntry(`Protocol changed to ${newProtocol}`, 'config');
    };

    const initiateEmergencyBroadcast = () => {
        addLogEntry('EMERGENCY BROADCAST INITIATED', 'emergency');
        alert('🚨 EMERGENCY BROADCAST SENT TO ALL NODES\n\nAll drones have been notified of emergency status.');
    };

    const performFrequencyHopping = () => {
        const frequencies = ['2.4GHz', '5.8GHz', '900MHz', '433MHz'];
        const newFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
        handleFrequencyChange(newFreq);
        addLogEntry('Frequency hopping executed for security', 'security');
    };

    const getSignalQuality = (strength) => {
        if (strength >= 80) return { label: 'Excellent', color: '#00ff00' };
        if (strength >= 60) return { label: 'Good', color: '#ffff00' };
        if (strength >= 40) return { label: 'Fair', color: '#ff8800' };
        return { label: 'Poor', color: '#ff0000' };
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#1a1a2e', color: '#eee', minHeight: '100vh' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* System Status Panel */}
                <div style={{ backgroundColor: '#16213e', padding: '20px', borderRadius: '10px', border: '1px solid #0f3460' }}>
                    <h2 style={{ color: '#00d4ff', marginBottom: '20px' }}>📻 Radio System Status</h2>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button
                            onClick={toggleRadioSystem}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: isRadioActive ? '#ff4444' : '#00aa44',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            {isRadioActive ? '🔴 Deactivate' : '🟢 Activate'} Radio
                        </button>

                        <button
                            onClick={toggleAutonomousMode}
                            disabled={!isRadioActive}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: isAutonomousMode ? '#ff8800' : '#0066cc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: isRadioActive ? 'pointer' : 'not-allowed',
                                opacity: isRadioActive ? 1 : 0.5
                            }}
                        >
                            {isAutonomousMode ? '🤖 Auto Mode' : '👤 Manual Mode'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Frequency:</label>
                            <select
                                value={radioConfig.frequency}
                                onChange={(e) => handleFrequencyChange(e.target.value)}
                                style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a4e', color: '#eee', border: '1px solid #444', borderRadius: '5px' }}
                            >
                                <option value="2.4GHz">2.4 GHz</option>
                                <option value="5.8GHz">5.8 GHz</option>
                                <option value="900MHz">900 MHz</option>
                                <option value="433MHz">433 MHz</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Protocol:</label>
                            <select
                                value={radioConfig.protocol}
                                onChange={(e) => handleProtocolChange(e.target.value)}
                                style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a4e', color: '#eee', border: '1px solid #444', borderRadius: '5px' }}
                            >
                                <option value="LoRa">LoRa</option>
                                <option value="WiFi">WiFi</option>
                                <option value="Zigbee">Zigbee</option>
                                <option value="Bluetooth">Bluetooth</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Topology:</label>
                            <select
                                value={radioConfig.topology}
                                onChange={(e) => setRadioConfig(prev => ({ ...prev, topology: e.target.value }))}
                                style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a4e', color: '#eee', border: '1px solid #444', borderRadius: '5px' }}
                            >
                                <option value="mesh">Mesh Network</option>
                                <option value="star">Star Network</option>
                                <option value="ring">Ring Network</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Encryption:</label>
                            <select
                                value={radioConfig.encryption}
                                onChange={(e) => setRadioConfig(prev => ({ ...prev, encryption: e.target.value }))}
                                style={{ width: '100%', padding: '8px', backgroundColor: '#2a2a4e', color: '#eee', border: '1px solid #444', borderRadius: '5px' }}
                            >
                                <option value="AES-256">AES-256</option>
                                <option value="AES-128">AES-128</option>
                                <option value="RSA">RSA</option>
                                <option value="None">None</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span>Signal Strength:</span>
                            <span style={{ color: getSignalQuality(signalStrength).color }}>
                                {signalStrength}% ({getSignalQuality(signalStrength).label})
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '10px', backgroundColor: '#333', borderRadius: '5px', overflow: 'hidden' }}>
                            <div
                                style={{
                                    width: `${signalStrength}%`,
                                    height: '100%',
                                    backgroundColor: getSignalQuality(signalStrength).color,
                                    transition: 'width 0.3s ease'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Network Topology Panel */}
                <div style={{ backgroundColor: '#16213e', padding: '20px', borderRadius: '10px', border: '1px solid #0f3460' }}>
                    <h2 style={{ color: '#00d4ff', marginBottom: '20px' }}>🌐 Network Topology</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                        {networkNodes.map(node => (
                            <div
                                key={node.id}
                                style={{
                                    padding: '10px',
                                    backgroundColor: node.status === 'online' ? '#0a4a2a' : '#4a0a0a',
                                    borderRadius: '8px',
                                    border: `2px solid ${node.role === 'master' ? '#ffd700' : '#666'}`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 'bold', color: node.role === 'master' ? '#ffd700' : '#eee' }}>
                                        {node.name}
                                    </span>
                                    <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        fontSize: '10px',
                                        backgroundColor: node.status === 'online' ? '#00aa44' : '#aa4444',
                                        color: 'white'
                                    }}>
                                        {node.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#aaa' }}>
                                    Signal: {node.signalStrength}%<br />
                                    Battery: {node.batteryLevel}%<br />
                                    Role: {node.role}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Data Transmission Stats */}
                <div style={{ backgroundColor: '#16213e', padding: '20px', borderRadius: '10px', border: '1px solid #0f3460' }}>
                    <h2 style={{ color: '#00d4ff', marginBottom: '20px' }}>📊 Transmission Statistics</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#0a3a5a', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff88' }}>{dataTransmission.sent}</div>
                            <div style={{ color: '#aaa' }}>Packets Sent</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#0a3a5a', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0088ff' }}>{dataTransmission.received}</div>
                            <div style={{ color: '#aaa' }}>Packets Received</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#0a3a5a', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4444' }}>{dataTransmission.errors}</div>
                            <div style={{ color: '#aaa' }}>Errors</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#0a3a5a', borderRadius: '8px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffaa00' }}>{dataTransmission.latency}ms</div>
                            <div style={{ color: '#aaa' }}>Latency</div>
                        </div>
                    </div>
                </div>

                {/* Security & Emergency Controls */}
                <div style={{ backgroundColor: '#16213e', padding: '20px', borderRadius: '10px', border: '1px solid #0f3460' }}>
                    <h2 style={{ color: '#00d4ff', marginBottom: '20px' }}>🔒 Security Controls</h2>

                    {jammerDetection.detected && (
                        <div style={{
                            padding: '10px',
                            backgroundColor: '#aa2222',
                            borderRadius: '5px',
                            marginBottom: '15px',
                            animation: 'blink 1s infinite'
                        }}>
                            ⚠️ JAMMER DETECTED at {jammerDetection.frequency.toFixed(1)} MHz
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            onClick={initiateEmergencyBroadcast}
                            style={{
                                padding: '12px',
                                backgroundColor: '#cc2222',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            🚨 Emergency Broadcast
                        </button>

                        <button
                            onClick={performFrequencyHopping}
                            style={{
                                padding: '12px',
                                backgroundColor: '#2266cc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Frequency Hopping
                        </button>

                        <button
                            onClick={() => addLogEntry('Network scan initiated', 'scan')}
                            style={{
                                padding: '12px',
                                backgroundColor: '#22aa22',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            📡 Network Scan
                        </button>
                    </div>
                </div>
            </div>

            {/* Communication Log */}
            <div style={{ backgroundColor: '#16213e', padding: '20px', borderRadius: '10px', border: '1px solid #0f3460' }}>
                <h2 style={{ color: '#00d4ff', marginBottom: '20px' }}>📝 Communication Log</h2>

                <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#0a0a1a', padding: '10px', borderRadius: '5px' }}>
                    {communicationLog.length === 0 ? (
                        <div style={{ color: '#666', textAlign: 'center' }}>No communication logs yet...</div>
                    ) : (
                        communicationLog.map(entry => (
                            <div
                                key={entry.id}
                                style={{
                                    padding: '5px 0',
                                    borderBottom: '1px solid #333',
                                    color: entry.type === 'emergency' ? '#ff4444' :
                                        entry.type === 'security' ? '#ffaa00' :
                                            entry.type === 'config' ? '#00aaff' : '#aaa'
                                }}
                            >
                                <span style={{ color: '#666' }}>[{entry.timestamp}]</span> {entry.message}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};

export default AutonomousRadioSystem;
