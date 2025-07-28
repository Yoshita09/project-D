import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import './EnhancedDroneCard.css';

const EnhancedDroneCard = memo(({
    drone,
    isSelected,
    onSelect,
    onToggleEmergency,
    onDestroy,
    onRepair,
    isUltimateHead,
    index
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const handleCardClick = useCallback(() => {
        onSelect(drone.id);
    }, [drone.id, onSelect]);

    const handleEmergencyClick = useCallback((e) => {
        e.stopPropagation();
        onToggleEmergency(drone.id);
    }, [drone.id, onToggleEmergency]);

    const handleDestroyClick = useCallback((e) => {
        e.stopPropagation();
        onDestroy(drone.id);
    }, [drone.id, onDestroy]);

    const handleRepairClick = useCallback((e) => {
        e.stopPropagation();
        onRepair(drone.id);
    }, [drone.id, onRepair]);

    const getBatteryColor = (battery) => {
        if (battery > 70) return '#4ade80';
        if (battery > 30) return '#fbbf24';
        return '#ef4444';
    };

    const getThreatLevelColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.9
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.3,
                delay: index * 0.05,
                ease: "easeOut"
            }
        },
        hover: {
            scale: 1.02,
            y: -2,
            transition: {
                duration: 0.2,
                ease: "easeInOut"
            }
        },
        tap: {
            scale: 0.98,
            transition: {
                duration: 0.1
            }
        }
    };

    const pulseVariants = {
        pulse: {
            scale: [1, 1.1, 1],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <motion.div
            className={`enhanced-drone-card ${isSelected ? 'selected' : ''} ${drone.status?.toLowerCase()} ${isUltimateHead ? 'ultimate-head' : ''}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-tooltip-id={`drone-tooltip-${drone.id}`}
            layout
        >
            {/* Status Indicator */}
            <motion.div
                className="status-indicator"
                variants={drone.emergencyActive ? pulseVariants : {}}
                animate={drone.emergencyActive ? "pulse" : ""}
                style={{
                    backgroundColor: drone.status === 'Active' ? '#10b981' :
                        drone.status === 'Destroyed' ? '#ef4444' : '#f59e0b'
                }}
            />

            {/* Ultimate Head Crown */}
            <AnimatePresence>
                {isUltimateHead && (
                    <motion.div
                        className="ultimate-head-crown"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        👑
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="drone-header">
                <div className="drone-info">
                    <h3 className="drone-name">{drone.name}</h3>
                    <span className="drone-type">{drone.type}</span>
                </div>
                <div className="drone-id">#{drone.id}</div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-item">
                    <div className="stat-label">Battery</div>
                    <div className="stat-value">
                        <motion.div
                            className="battery-bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${drone.battery}%` }}
                            transition={{ duration: 1, delay: index * 0.02 }}
                            style={{ backgroundColor: getBatteryColor(drone.battery) }}
                        />
                        <span>{drone.battery}%</span>
                    </div>
                </div>

                <div className="stat-item">
                    <div className="stat-label">Altitude</div>
                    <div className="stat-value">{drone.altitude}m</div>
                </div>

                <div className="stat-item">
                    <div className="stat-label">Speed</div>
                    <div className="stat-value">{drone.speed} km/h</div>
                </div>

                <div className="stat-item">
                    <div className="stat-label">Threat</div>
                    <div
                        className="threat-level"
                        style={{ color: getThreatLevelColor(drone.threatLevel) }}
                    >
                        {drone.threatLevel}
                    </div>
                </div>
            </div>

            {/* Location */}
            <div className="location-info">
                <span className="location-icon">📍</span>
                <span>{drone.location}</span>
            </div>

            {/* Action Buttons */}
            <AnimatePresence>
                {(isHovered || isSelected) && (
                    <motion.div
                        className="action-buttons"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.button
                            className={`action-btn emergency ${drone.emergencyActive ? 'active' : ''}`}
                            onClick={handleEmergencyClick}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={drone.status === 'Destroyed'}
                        >
                            🚨
                        </motion.button>

                        {drone.status === 'Destroyed' ? (
                            <motion.button
                                className="action-btn repair"
                                onClick={handleRepairClick}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                🔧
                            </motion.button>
                        ) : (
                            <motion.button
                                className="action-btn destroy"
                                onClick={handleDestroyClick}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                💥
                            </motion.button>
                        )}

                        <motion.button
                            className="action-btn details"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDetails(!showDetails);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            ℹ️
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detailed Info Panel */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        className="details-panel"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="detail-row">
                            <span>Last Action:</span>
                            <span>{drone.lastReflexAction || 'None'}</span>
                        </div>
                        <div className="detail-row">
                            <span>Emergency Time:</span>
                            <span>{drone.lastEmergencyTime || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span>Max Altitude:</span>
                            <span>{drone.maxAltitude || 'N/A'}m</span>
                        </div>
                        <div className="detail-row">
                            <span>Max Speed:</span>
                            <span>{drone.maxSpeed || 'N/A'} km/h</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tooltip */}
            <Tooltip
                id={`drone-tooltip-${drone.id}`}
                place="top"
                content={`${drone.name} - ${drone.type} | Battery: ${drone.battery}% | Status: ${drone.status}`}
                style={{
                    backgroundColor: '#1f2937',
                    color: '#f9fafb',
                    borderRadius: '8px',
                    fontSize: '12px'
                }}
            />
        </motion.div>
    );
});

EnhancedDroneCard.displayName = 'EnhancedDroneCard';

export default EnhancedDroneCard;
