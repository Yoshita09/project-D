import numpy as np
import cv2
from ultralytics import YOLO
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
from filterpy.kalman import KalmanFilter, ExtendedKalmanFilter
import joblib
import os
from datetime import datetime, timedelta
import json
import threading
import time
import random

class AdvancedMilitaryAI:
    def __init__(self):
        # Main object detection model
        self.model = YOLO("yolov8m.pt")
        # Specialized models for military applications
        self.thermal_model = None  # Will be initialized if thermal data is provided
        self.behavior_classifier = None
        self.threat_predictor = None
        
        # Tracking and sensor fusion
        self.tracked_objects = {}
        self.kalman_filters = {}  # For object trajectory prediction
        self.scaler = StandardScaler()
        
        # Enhanced tracking history for behavioral analysis
        self.tracking_history = {}  # Dictionary to store tracking history for each object
        self.max_history_length = 30  # Maximum number of history entries per object
        
        # Multi-sensor fusion components
        self.sensor_data = {
            'gps': None,
            'imu': None,
            'thermal': None,
            'lidar': None,
            'radar': None,
            'visual': None
        }
        
        # Swarm communication and state
        self.swarm_state = {
            'drones': {},
            'leader': None,
            'formation': 'default',
            'mission_status': 'idle'
        }
        
        # Event-based detection
        self.event_detection_active = False
        self.event_thresholds = {
            'sound': 85.0,  # dB
            'motion': 0.6,  # confidence
            'thermal': 40.0  # degrees C
        }
        
        # Visualization buffer for tracked objects
        self.latest_visualization = None
        
        # Load pre-trained models
        self.load_models()
        
        # Start background threads for continuous processing
        self.running = True
        threading.Thread(target=self.continuous_threat_assessment, daemon=True).start()
    
    def load_models(self):
        """Load pre-trained models for various detection and classification tasks"""
        try:
            # Load behavior and threat prediction models
            if os.path.exists('models/behavior_classifier.pkl'):
                self.behavior_classifier = joblib.load('models/behavior_classifier.pkl')
            if os.path.exists('models/threat_predictor.pkl'):
                self.threat_predictor = joblib.load('models/threat_predictor.pkl')
                
            # Load thermal detection model if available
            if os.path.exists('models/thermal_yolov8.pt'):
                self.thermal_model = YOLO('models/thermal_yolov8.pt')
            
            # Load specialized military object detection model if available
            if os.path.exists('models/military_yolov8.pt'):
                self.model = YOLO('models/military_yolov8.pt')
                
        except Exception as e:
            print(f"Error loading models: {e}")
            print("Using default classifiers.")
            self.behavior_classifier = RandomForestClassifier(n_estimators=100)
            self.threat_predictor = RandomForestClassifier(n_estimators=100)
    
    def analyze_behavior(self, detections, frame_history):
        """Analyze behavioral patterns of detected objects"""
        behavioral_features = []
        for detection in detections:
            features = {
                'speed': self.calculate_speed(detection, frame_history),
                'direction_change': self.calculate_direction_change(detection, frame_history),
                'proximity_to_others': self.calculate_proximity(detection, detections),
                'movement_pattern': self.classify_movement_pattern(detection, frame_history),
                'threat_level': detection.get('threat_level', 'LOW')
            }
            behavioral_features.append(features)
        return behavioral_features
    
    def predict_threat_evolution(self, current_threats, historical_data):
        """Predict how threats might evolve over time using historical patterns
        
        Args:
            current_threats: List of current threat objects
            historical_data: Historical threat data for pattern analysis
            
        Returns:
            List of threat predictions with escalation probabilities and recommendations
        """
        predictions = []
        
        # Analyze historical patterns if we have enough data
        historical_patterns = self.analyze_threat_patterns(historical_data) if len(historical_data) >= 3 else {}
        
        for threat in current_threats:
            # Get threat type and current level
            threat_type = threat.get('type', 'unknown')
            current_level = threat.get('threat_level', 'LOW')
            
            # Check if we have historical pattern data for this type of threat
            pattern_factor = 1.0
            if threat_type in historical_patterns:
                pattern = historical_patterns[threat_type]
                
                # Adjust prediction based on historical escalation patterns
                if pattern.get('escalation_rate', 0) > 0.5:
                    pattern_factor = 1.5  # Threats of this type tend to escalate quickly
                elif pattern.get('persistence', 0) > 0.7:
                    pattern_factor = 1.2  # Threats of this type tend to persist
            
            # Calculate base escalation probability
            base_escalation = self.predict_escalation(threat, historical_data)
            
            # Apply pattern-based adjustment
            adjusted_escalation = min(1.0, base_escalation * pattern_factor)
            
            # Calculate time to critical based on escalation rate
            time_to_critical = self.estimate_time_to_critical(threat)
            if adjusted_escalation > base_escalation:
                # If escalation is higher, time to critical is shorter
                time_to_critical = max(10, time_to_critical / pattern_factor)
            
            # Determine recommended action based on adjusted threat assessment
            recommended_action = self.get_recommended_action(threat)
            
            # For high escalation probability, recommend more urgent action
            if adjusted_escalation > 0.8 and recommended_action == 'Monitor':
                recommended_action = 'Intercept'
            elif adjusted_escalation > 0.9 and recommended_action == 'Intercept':
                recommended_action = 'Engage'
            
            # Create prediction object with detailed information
            prediction = {
                'object_id': threat['id'],
                'type': threat_type,
                'current_threat': current_level,
                'predicted_escalation': adjusted_escalation,
                'time_to_critical': time_to_critical,
                'recommended_action': recommended_action,
                'confidence': 0.7 if historical_patterns else 0.5,  # Higher confidence with historical data
                'pattern_based': bool(historical_patterns)
            }
            
            predictions.append(prediction)
        
        return predictions
        
    def analyze_threat_patterns(self, historical_data):
        """Analyze historical threat data to identify patterns
        
        Args:
            historical_data: List of historical threat assessments
            
        Returns:
            Dictionary of threat patterns by type
        """
        if not historical_data:
            return {}
        
        # Extract all threats from historical data
        all_threats = []
        for history in historical_data:
            if 'threats' in history:
                all_threats.extend([(threat, history.get('timestamp', 0)) 
                                   for threat in history['threats']])
        
        # Group threats by type
        threats_by_type = {}
        for threat, timestamp in all_threats:
            threat_type = threat.get('type', 'unknown')
            if threat_type not in threats_by_type:
                threats_by_type[threat_type] = []
            threats_by_type[threat_type].append((threat, timestamp))
        
        # Analyze patterns for each threat type
        patterns = {}
        for threat_type, threats in threats_by_type.items():
            if len(threats) < 2:
                continue
                
            # Sort by timestamp if available
            threats.sort(key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0)
            
            # Calculate escalation rate (how often threats of this type escalate)
            escalation_count = 0
            for i in range(1, len(threats)):
                prev_level = threats[i-1][0].get('threat_level', 'LOW')
                curr_level = threats[i][0].get('threat_level', 'LOW')
                
                # Check if threat level increased
                threat_levels = ['LOW', 'MEDIUM', 'HIGH']
                if threat_levels.index(curr_level) > threat_levels.index(prev_level):
                    escalation_count += 1
            
            escalation_rate = escalation_count / (len(threats) - 1) if len(threats) > 1 else 0
            
            # Calculate persistence (how long threats of this type typically last)
            # For simulation, we'll use the number of consecutive detections as a proxy
            persistence = min(1.0, len(threats) / 10)  # Normalize to 0-1 range
            
            # Calculate average threat level
            threat_level_values = {'LOW': 0, 'MEDIUM': 1, 'HIGH': 2}
            avg_threat_level = sum(threat_level_values.get(t[0].get('threat_level', 'LOW'), 0) 
                                   for t in threats) / len(threats)
            
            # Store pattern data
            patterns[threat_type] = {
                'count': len(threats),
                'escalation_rate': escalation_rate,
                'persistence': persistence,
                'avg_threat_level': avg_threat_level,
                'last_seen': threats[-1][1]
            }
        
        return patterns
    
    def multi_object_tracking(self, detections, frame_id):
        """Track multiple objects across frames using IoU-based matching and Kalman filtering
        
        Args:
            detections: List of current frame detections
            frame_id: Current frame identifier or timestamp
            
        Returns:
            Dictionary of tracked objects with updated information
        """
        # Initialize current tracks dictionary
        current_tracks = {}
        
        # If this is the first frame or we have no existing tracks
        if not hasattr(self, 'active_tracks'):
            self.active_tracks = {}
            self.next_track_id = 0
            self.track_age = {}
            self.track_missed_frames = {}
        
        # Convert detections list to a more usable format
        current_detections = {}
        for detection in detections:
            det_id = detection['id']
            current_detections[det_id] = detection
        
        # Match existing tracks to new detections using IoU
        matched_tracks = {}
        unmatched_detections = list(current_detections.keys())
        
        # For each existing track, find the best matching detection
        for track_id, track_info in self.active_tracks.items():
            best_match = None
            best_iou = 0.3  # Minimum IoU threshold for matching
            
            # Get the last known bounding box for this track
            if 'bbox' in track_info:
                track_bbox = track_info['bbox']
                
                # Compare with each detection
                for det_id in unmatched_detections:
                    det_bbox = current_detections[det_id]['bounding_box']
                    
                    # Calculate IoU between track and detection
                    iou = self.calculate_iou(track_bbox, det_bbox)
                    
                    # If this is the best match so far, update
                    if iou > best_iou:
                        best_iou = iou
                        best_match = det_id
            
            # If we found a match, update the track
            if best_match:
                matched_tracks[track_id] = best_match
                unmatched_detections.remove(best_match)
                
                # Reset missed frames counter
                self.track_missed_frames[track_id] = 0
            else:
                # Increment missed frames counter
                self.track_missed_frames[track_id] = self.track_missed_frames.get(track_id, 0) + 1
        
        # Update matched tracks
        for track_id, det_id in matched_tracks.items():
            detection = current_detections[det_id]
            
            # Update track information
            self.active_tracks[track_id] = {
                'id': track_id,
                'bbox': detection['bounding_box'],
                'type': detection['type'],
                'confidence': detection['confidence'],
                'threat_level': detection['threat_level'],
                'source': detection['source'],
                'last_seen': frame_id
            }
            
            # Copy any additional fields from detection
            for key, value in detection.items():
                if key not in ['id', 'bounding_box', 'type', 'confidence', 'threat_level', 'source']:
                    self.active_tracks[track_id][key] = value
            
            # Add to current tracks output
            current_tracks[track_id] = self.active_tracks[track_id]
            
            # Update track age
            self.track_age[track_id] = self.track_age.get(track_id, 0) + 1
        
        # Create new tracks for unmatched detections
        for det_id in unmatched_detections:
            detection = current_detections[det_id]
            
            # Generate a new track ID
            track_id = f"track_{self.next_track_id}"
            self.next_track_id += 1
            
            # Create new track
            self.active_tracks[track_id] = {
                'id': track_id,
                'bbox': detection['bounding_box'],
                'type': detection['type'],
                'confidence': detection['confidence'],
                'threat_level': detection['threat_level'],
                'source': detection['source'],
                'last_seen': frame_id
            }
            
            # Copy any additional fields from detection
            for key, value in detection.items():
                if key not in ['id', 'bounding_box', 'type', 'confidence', 'threat_level', 'source']:
                    self.active_tracks[track_id][key] = value
            
            # Initialize track age and missed frames
            self.track_age[track_id] = 1
            self.track_missed_frames[track_id] = 0
            
            # Add to current tracks output
            current_tracks[track_id] = self.active_tracks[track_id]
        
        # Remove tracks that have been missing for too long
        max_missed_frames = 30  # Maximum number of frames a track can be missing
        tracks_to_remove = []
        
        for track_id, missed_frames in self.track_missed_frames.items():
            if missed_frames > max_missed_frames:
                tracks_to_remove.append(track_id)
        
        for track_id in tracks_to_remove:
            if track_id in self.active_tracks:
                del self.active_tracks[track_id]
            if track_id in self.track_age:
                del self.track_age[track_id]
            if track_id in self.track_missed_frames:
                del self.track_missed_frames[track_id]
        
        return current_tracks
    
    def calculate_iou(self, bbox1, bbox2):
        """Calculate Intersection over Union (IoU) between two bounding boxes
        
        Args:
            bbox1: First bounding box [x1, y1, x2, y2]
            bbox2: Second bounding box [x1, y1, x2, y2]
            
        Returns:
            float: IoU value between 0 and 1
        """
        # Extract coordinates
        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2
        
        # Calculate area of each bounding box
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        
        # Calculate coordinates of intersection
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        # Check if there is an intersection
        if x2_i <= x1_i or y2_i <= y1_i:
            return 0.0
        
        # Calculate area of intersection
        area_intersection = (x2_i - x1_i) * (y2_i - y1_i)
        
        # Calculate IoU
        area_union = area1 + area2 - area_intersection
        iou = area_intersection / area_union if area_union > 0 else 0.0
        
        return iou
    
    def calculate_speed(self, detection, frame_history):
        """Calculate object speed based on position changes"""
        if len(frame_history) < 2:
            return 0.0
        # Simplified speed calculation
        return np.random.uniform(0, 50)  # km/h
    
    def calculate_direction_change(self, detection, frame_history):
        """Calculate direction changes"""
        if len(frame_history) < 3:
            return 0.0
        return np.random.uniform(0, 180)  # degrees
    
    def calculate_proximity(self, detection, all_detections):
        """Calculate proximity to other objects"""
        if len(all_detections) < 2:
            return 100.0  # meters
        return np.random.uniform(10, 200)  # meters
    
    def classify_movement_pattern(self, detection, frame_history):
        """Classify movement patterns"""
        patterns = ['linear', 'circular', 'erratic', 'stationary', 'approaching']
        return np.random.choice(patterns)
    
    def predict_escalation(self, threat, historical_data):
        """Predict threat escalation probability"""
        escalation_factors = {
            'speed': threat.get('speed', 0),
            'proximity': threat.get('proximity', 100),
            'behavior': threat.get('behavior', 'normal'),
            'weapon_systems': threat.get('weapon_systems', False)
        }
        # Simplified escalation prediction
        escalation_score = sum(escalation_factors.values()) / len(escalation_factors)
        return min(escalation_score / 100, 1.0)
    
    def estimate_time_to_critical(self, threat):
        """Estimate time until threat becomes critical"""
        base_time = 300  # 5 minutes
        threat_multiplier = {
            'LOW': 3.0,
            'MEDIUM': 1.5,
            'HIGH': 0.5
        }
        return base_time * threat_multiplier.get(threat['threat_level'], 1.0)
    
    def get_recommended_action(self, threat):
        """Get recommended action based on threat analysis"""
        actions = {
            'LOW': 'Monitor',
            'MEDIUM': 'Intercept',
            'HIGH': 'Engage'
        }
        return actions.get(threat['threat_level'], 'Monitor')
    
    # Note: The assign_track_id method is no longer needed as track ID assignment is handled in multi_object_tracking
    
    # Note: This legacy update_track_history method is kept for backward compatibility
    # but the main tracking history is now managed by the update_track_history method defined later
    def update_track_history(self, track_id, detection, frame_id):
        """Legacy method for updating tracking history for an object
        
        This method is maintained for backward compatibility with existing code.
        New code should use the enhanced tracking history management.
        
        Args:
            track_id: Unique identifier for the tracked object
            detection: Detection data for the object
            frame_id: Current frame identifier or timestamp
            
        Returns:
            List of historical tracking data for the object
        """
        if track_id not in self.tracked_objects:
            self.tracked_objects[track_id] = []
        
        # Create history entry with more comprehensive data
        history_entry = {
            'frame_id': frame_id,
            'bbox': detection['bounding_box'],
            'timestamp': datetime.now().isoformat(),
            'type': detection.get('type', 'unknown'),
            'confidence': detection.get('confidence', 0.0),
            'threat_level': detection.get('threat_level', 'LOW'),
            'source': detection.get('source', 'visual')
        }
        
        self.tracked_objects[track_id].append(history_entry)
        
        # Keep only last 30 frames
        if len(self.tracked_objects[track_id]) > 30:
            self.tracked_objects[track_id] = self.tracked_objects[track_id][-30:]
        
        return self.tracked_objects[track_id]

def continuous_threat_assessment(self):
        """Background thread for continuous threat assessment with advanced analytics
        
        This method runs in a separate thread and continuously:
        1. Processes sensor data using sensor fusion
        2. Detects and analyzes potential threats
        3. Predicts threat evolution over time
        4. Monitors for environmental events
        5. Maintains a threat history for pattern analysis
        6. Visualizes tracked objects with threat levels
        """
        # Initialize threat history storage and visualization buffer
        self.threat_history = []
        self.last_full_analysis = time.time()
        self.analysis_interval = 5  # Seconds between full threat analyses
        self.latest_visualization = None  # Buffer for visualization frame
        
        while self.running:
            try:
                # Simulate continuous processing with adaptive sleep
                # Sleep less when threats are detected
                threat_level = self.get_current_threat_level()
                adaptive_sleep = max(0.2, 1.0 - (threat_level * 0.8))
                time.sleep(adaptive_sleep)
                
                current_time = time.time()
                
                # Process any pending sensor data with sensor fusion
                if any(self.sensor_data.values()):
                    fused_data = self.fuse_sensor_data()
                    # Store fused position data for trajectory analysis
                    if hasattr(self, 'position_history'):
                        self.position_history.append({
                            'timestamp': current_time,
                            'position': fused_data['position'],
                            'uncertainty': fused_data['uncertainty'][:3]
                        })
                    else:
                        self.position_history = [{
                            'timestamp': current_time,
                            'position': fused_data['position'],
                            'uncertainty': fused_data['uncertainty'][:3]
                        }]
                    
                    # Limit history size
                    if len(self.position_history) > 100:
                        self.position_history = self.position_history[-100:]
                    
                    # Process video frame with tracking visualization if available
                    if 'frame' in fused_data and hasattr(self, 'active_tracks') and self.active_tracks:
                        # Convert active_tracks to format for visualization
                        tracked_objects = {}
                        for track_id, track_data in self.active_tracks.items():
                            # Skip tracks without bounding boxes
                            if 'bbox' not in track_data:
                                continue
                                
                            # Prepare object data for visualization
                            obj = {
                                'bbox': track_data.get('bbox'),
                                'type': track_data.get('type', 'unknown'),
                                'threat_level': track_data.get('threat_level', 'LOW'),
                                'confidence': track_data.get('confidence', 0)
                            }
                            
                            # Add behavior if available
                            if hasattr(self, 'tracking_history') and track_id in self.tracking_history:
                                track_history = self.tracking_history[track_id]
                                if len(track_history) >= 3:
                                    # Classify behavior based on tracking history
                                    behavior = self.classify_threat_behavior(track_history)
                                    obj['behavior'] = behavior
                                    
                                    # Add predicted positions
                                    predicted_positions = self.predict_future_positions(track_history)
                                    if predicted_positions:
                                        obj['predicted_positions'] = predicted_positions
                            
                            tracked_objects[track_id] = obj
                        
                        # Visualize tracked objects on frame
                        if tracked_objects and 'frame' in fused_data:
                            vis_frame = self.visualize_tracked_objects(fused_data['frame'], tracked_objects)
                            
                            # Store visualized frame for external access
                            self.latest_visualization = vis_frame
                
                # Perform full threat analysis at regular intervals
                if current_time - self.last_full_analysis > self.analysis_interval:
                    self.last_full_analysis = current_time
                    
                    # Analyze current threats based on recent detections
                    current_threats = self.analyze_current_threats()
                    
                    # Predict how threats might evolve
                    if current_threats:
                        threat_predictions = self.predict_threat_evolution(
                            current_threats, 
                            self.threat_history
                        )
                        
                        # Store predictions for later validation
                        self.threat_history.append({
                            'timestamp': current_time,
                            'threats': current_threats,
                            'predictions': threat_predictions
                        })
                        
                        # Limit history size
                        if len(self.threat_history) > 50:
                            self.threat_history = self.threat_history[-50:]
                        
                        # Generate alerts for high-priority threats
                        self.generate_threat_alerts(threat_predictions)
                
                # Check for environmental events if event detection is active
                if self.event_detection_active:
                    event = self.check_for_events()
                    if event:
                        # Log the event and adjust threat assessment
                        self.process_detected_event(event)
                        
                # Update swarm with latest threat information if in swarm mode
                if self.swarm_state['drones'] and len(self.swarm_state['drones']) > 1:
                    self.share_threat_data_with_swarm()
                    
            except Exception as e:
                print(f"Error in continuous threat assessment: {e}")
                # Brief pause after error before retrying
                time.sleep(0.5)
    
    def classify_threat_realtime(self, frame, thermal_frame=None, radar_data=None, lidar_data=None, acoustic_data=None):
        """Real-time threat classification using multi-sensor fusion and behavioral analysis
        
        Args:
            frame: RGB camera frame
            thermal_frame: Optional thermal imaging frame
            radar_data: Optional radar detection data
            lidar_data: Optional LiDAR point cloud data
            acoustic_data: Optional acoustic sensor data
            
        Returns:
            List of detections with threat classifications and behavioral analysis
        """
        # Process visual frame with YOLOv8
        visual_results = self.model(frame, verbose=False)
        
        # Process thermal frame if available
        thermal_results = None
        if thermal_frame is not None and self.thermal_model is not None:
            thermal_results = self.thermal_model(thermal_frame, verbose=False)
        
        # Combine detections
        detections = []
        timestamp = time.time()
        
        # Process visual detections
        for i, detection in enumerate(visual_results[0].boxes.data):
            x1, y1, x2, y2, conf, cls = detection
            class_name = visual_results[0].names[int(cls)]
            
            # Initial threat level (will be refined after tracking and behavior analysis)
            threat_level = self.determine_threat_level(class_name, float(conf))
            
            detections.append({
                'id': f"obj_{i}_{timestamp}",  # Include timestamp for uniqueness
                'type': class_name,
                'bounding_box': [float(x1), float(y1), float(x2), float(y2)],
                'confidence': float(conf),
                'threat_level': threat_level,
                'source': 'visual',
                'timestamp': timestamp
            })
        
        # Process thermal detections if available
        if thermal_results is not None:
            for i, detection in enumerate(thermal_results[0].boxes.data):
                x1, y1, x2, y2, conf, cls = detection
                class_name = thermal_results[0].names[int(cls)]
                
                # Initial threat level (will be refined after tracking and behavior analysis)
                threat_level = self.determine_threat_level(class_name, float(conf), source='thermal')
                
                detections.append({
                    'id': f"thermal_{i}_{timestamp}",  # Include timestamp for uniqueness
                    'type': class_name,
                    'bounding_box': [float(x1), float(y1), float(x2), float(y2)],
                    'confidence': float(conf),
                    'threat_level': threat_level,
                    'source': 'thermal',
                    'timestamp': timestamp
                })
        
        # Process radar data if available
        if radar_data is not None:
            for i, detection in enumerate(radar_data):
                # Radar typically provides position, velocity, and sometimes classification
                position = detection.get('position', [0, 0, 0])
                velocity = detection.get('velocity', [0, 0, 0])
                class_name = detection.get('class', 'unknown')
                confidence = detection.get('confidence', 0.7)  # Radar usually has good confidence
                
                # Convert radar position to bounding box format if needed for tracking
                # This is a simplification - real implementation would be more sophisticated
                x, y, z = position
                size = 50  # Default size for radar detection visualization
                bbox = [x - size/2, y - size/2, x + size/2, y + size/2]
                
                detections.append({
                    'id': f"radar_{i}_{timestamp}",
                    'type': class_name,
                    'bounding_box': bbox,
                    'position': position,
                    'velocity': velocity,
                    'confidence': confidence,
                    'threat_level': self.determine_threat_level(class_name, confidence, source='radar'),
                    'source': 'radar',
                    'timestamp': timestamp
                })
        
        # Process LiDAR data if available
        if lidar_data is not None:
            for i, detection in enumerate(lidar_data):
                position = detection.get('position', [0, 0, 0])
                dimensions = detection.get('dimensions', [1, 1, 1])  # Width, height, depth
                class_name = detection.get('class', 'unknown')
                confidence = detection.get('confidence', 0.6)
                
                # Convert 3D position to 2D bounding box for tracking
                x, y, z = position
                w, h, d = dimensions
                bbox = [x - w/2, y - h/2, x + w/2, y + h/2]
                
                detections.append({
                    'id': f"lidar_{i}_{timestamp}",
                    'type': class_name,
                    'bounding_box': bbox,
                    'position': position,
                    'dimensions': dimensions,
                    'confidence': confidence,
                    'threat_level': self.determine_threat_level(class_name, confidence, source='lidar'),
                    'source': 'lidar',
                    'timestamp': timestamp
                })
        
        # Process acoustic data if available
        if acoustic_data is not None:
            for i, detection in enumerate(acoustic_data):
                direction = detection.get('direction', [0, 0])  # Direction vector
                intensity = detection.get('intensity', 0.5)
                class_name = detection.get('class', 'unknown')
                confidence = detection.get('confidence', 0.4)  # Acoustic usually less certain
                
                # For acoustic, we might not have precise position, just direction
                # Create a placeholder bounding box in the direction of the sound
                # Real implementation would use triangulation from multiple sensors
                dx, dy = direction
                distance = 100  # Placeholder distance
                center_x, center_y = 400 + dx * distance, 300 + dy * distance  # Assuming frame center at (400, 300)
                size = 40
                bbox = [center_x - size/2, center_y - size/2, center_x + size/2, center_y + size/2]
                
                detections.append({
                    'id': f"acoustic_{i}_{timestamp}",
                    'type': class_name,
                    'bounding_box': bbox,
                    'direction': direction,
                    'intensity': intensity,
                    'confidence': confidence,
                    'threat_level': self.determine_threat_level(class_name, confidence, source='acoustic'),
                    'source': 'acoustic',
                    'timestamp': timestamp
                })
        
        # Track objects across frames
        tracked_detections = self.multi_object_tracking(detections, int(timestamp))
        
        # Update tracking history for all objects
        self.update_track_history(tracked_detections)
        
        # Enhance threat assessment with behavioral analysis
        enhanced_detections = self.enhance_threat_assessment(tracked_detections)
        
        return enhanced_detections
    
    def enhance_threat_assessment(self, tracked_detections):
        """Enhance threat assessment with behavioral analysis and pattern detection
        
        Args:
            tracked_detections: Dictionary of tracked detections
            
        Returns:
            Dictionary of enhanced detections with behavioral analysis
        """
        enhanced_detections = {}
        
        # Check for coordinated threats if we have enough objects
        coordinated_groups = []
        if len(tracked_detections) >= 3 and hasattr(self, 'detect_coordinated_threats'):
            coordinated_groups = self.detect_coordinated_threats()
        
        # Check for rapid movements
        rapid_movements = []
        if hasattr(self, 'detect_rapid_movements'):
            rapid_movements = self.detect_rapid_movements()
        
        # Create lookup dictionaries for quick access
        coordinated_lookup = {}
        for group_idx, group in enumerate(coordinated_groups):
            for member_id in group.get('members', []):
                coordinated_lookup[member_id] = {
                    'group_id': group_idx,
                    'formation_type': group.get('formation_type', 'unknown'),
                    'movement_aligned': group.get('movement_aligned', False)
                }
        
        rapid_movement_lookup = {}
        for movement in rapid_movements:
            rapid_movement_lookup[movement['id']] = {
                'evasive_pattern': movement.get('evasive_pattern', False),
                'max_speed': movement.get('max_speed', 0),
                'max_direction_change': movement.get('max_direction_change', 0)
            }
        
        # Enhance each tracked detection
        for track_id, detection in tracked_detections.items():
            # Get track history for behavior classification
            track_history = self.get_track_history(track_id)
            
            # Classify behavior based on movement patterns
            behavior = self.classify_threat_behavior(track_history, detection)
            
            # Determine movement pattern
            movement_pattern = 'linear'  # Default
            
            # Check if this object is part of a coordinated group
            if track_id in coordinated_lookup:
                group_info = coordinated_lookup[track_id]
                movement_pattern = 'coordinated'
                detection['group_id'] = group_info['group_id']
                detection['formation_type'] = group_info['formation_type']
            
            # Check if this object has rapid/evasive movement
            elif track_id in rapid_movement_lookup:
                movement_info = rapid_movement_lookup[track_id]
                if movement_info['evasive_pattern']:
                    movement_pattern = 'zigzag'
                elif movement_info['max_direction_change'] > 45:
                    movement_pattern = 'circular'
                elif movement_info['max_speed'] > 20:
                    movement_pattern = 'rapid'
            
            # If no special pattern detected, use behavior to infer pattern
            elif behavior:
                if behavior == 'erratic':
                    movement_pattern = 'random'
                elif behavior == 'circling':
                    movement_pattern = 'circular'
                elif behavior == 'stationary':
                    movement_pattern = 'stationary'
            
            # Add behavior and movement pattern to detection
            detection['behavior'] = behavior
            detection['movement_pattern'] = movement_pattern
            
            # Refine threat level with behavior and movement pattern
            class_name = detection.get('type', 'unknown')
            confidence = detection.get('confidence', 0.5)
            source = detection.get('source', 'visual')
            
            # Update threat level with behavior and movement pattern information
            refined_threat_level = self.determine_threat_level(
                class_name, 
                confidence, 
                source, 
                behavior, 
                movement_pattern
            )
            
            detection['threat_level'] = refined_threat_level
            
            # Add prediction of future position if we have enough tracking history
            if track_history and len(track_history) >= 3:
                future_positions = self.predict_future_positions(track_history)
                detection['predicted_positions'] = future_positions
            
            enhanced_detections[track_id] = detection
        
        return enhanced_detections
    
    def update_track_history(self, tracked_detections):
        """Update tracking history for all objects
        
        Args:
            tracked_detections: Dictionary of currently tracked objects
        """
        # Initialize tracking history dictionary if it doesn't exist
        if not hasattr(self, 'tracking_history'):
            self.tracking_history = {}
        
        # Current timestamp
        timestamp = time.time()
        
        # Update history for each tracked object
        for track_id, detection in tracked_detections.items():
            # Create entry for this object if it doesn't exist
            if track_id not in self.tracking_history:
                self.tracking_history[track_id] = []
            
            # Add current detection to history
            history_entry = {
                'timestamp': timestamp,
                'bbox': detection.get('bounding_box'),
                'position': detection.get('position'),
                'velocity': detection.get('velocity'),
                'type': detection.get('type'),
                'confidence': detection.get('confidence'),
                'threat_level': detection.get('threat_level'),
                'source': detection.get('source')
            }
            
            self.tracking_history[track_id].append(history_entry)
            
            # Limit history size to prevent memory issues
            max_history = 100  # Keep last 100 positions
            if len(self.tracking_history[track_id]) > max_history:
                self.tracking_history[track_id] = self.tracking_history[track_id][-max_history:]
    
    def get_track_history(self, object_id, max_history=20):
        """Get tracking history for a specific object
        
        Args:
            object_id: Unique identifier for the object
            max_history: Maximum number of historical entries to return
            
        Returns:
            list: Historical tracking data for the object
        """
        # Initialize tracking history dictionary if it doesn't exist
        if not hasattr(self, 'tracking_history'):
            self.tracking_history = {}
        
        # Return history for this object (empty list if none exists)
        return self.tracking_history.get(object_id, [])[-max_history:]
    
    def predict_future_positions(self, track_history, time_horizon=5, steps=10):
        """Predict future positions of an object based on its tracking history
        
        Args:
            track_history: Historical tracking data for the object
            time_horizon: Time in seconds to predict into the future
            steps: Number of prediction steps
            
        Returns:
            list: Predicted future positions [(x1,y1,t1), (x2,y2,t2), ...]
        """
        if len(track_history) < 3:
            return []
        
        # Extract position and timestamp data
        positions = []
        timestamps = []
        
        for entry in track_history[-10:]:  # Use last 10 entries for prediction
            if 'bbox' in entry and entry['bbox']:
                bbox = entry['bbox']
                center_x = (bbox[0] + bbox[2]) / 2
                center_y = (bbox[1] + bbox[3]) / 2
                positions.append((center_x, center_y))
                timestamps.append(entry['timestamp'])
            elif 'position' in entry and entry['position']:
                pos = entry['position']
                positions.append((pos[0], pos[1]))
                timestamps.append(entry['timestamp'])
        
        if len(positions) < 3:
            return []
        
        # Calculate average velocity from recent positions
        recent_velocities = []
        for i in range(1, len(positions)):
            dt = timestamps[i] - timestamps[i-1]
            if dt > 0:  # Avoid division by zero
                dx = positions[i][0] - positions[i-1][0]
                dy = positions[i][1] - positions[i-1][1]
                vx = dx / dt
                vy = dy / dt
                recent_velocities.append((vx, vy))
        
        if not recent_velocities:
            return []
        
        # Calculate average velocity
        avg_vx = sum(v[0] for v in recent_velocities) / len(recent_velocities)
        avg_vy = sum(v[1] for v in recent_velocities) / len(recent_velocities)
        
        # Get last known position and timestamp
        last_pos = positions[-1]
        last_time = timestamps[-1]
        
        # Predict future positions
        future_positions = []
        time_step = time_horizon / steps
        
        for i in range(1, steps + 1):
            future_time = last_time + (i * time_step)
            dt = future_time - last_time
            
            # Linear prediction
            future_x = last_pos[0] + (avg_vx * dt)
            future_y = last_pos[1] + (avg_vy * dt)
            
            future_positions.append((future_x, future_y, future_time))
        
        return future_positions
    
    def visualize_tracked_objects(self, frame, tracked_objects, show_predictions=True, show_history=True):
        """Visualize tracked objects with threat levels and predictions
        
        Args:
            frame: Original video frame
            tracked_objects: Dictionary of tracked objects
            show_predictions: Whether to show predicted future positions
            show_history: Whether to show tracking history
            
        Returns:
            frame: Annotated video frame
        """
        # Create a copy of the frame for drawing
        vis_frame = frame.copy()
        
        # Define colors for different threat levels
        colors = {
            'HIGH': (0, 0, 255),    # Red
            'MEDIUM': (0, 165, 255), # Orange
            'LOW': (0, 255, 0)       # Green
        }
        
        # Draw each tracked object
        for track_id, obj in tracked_objects.items():
            # Get bounding box
            if 'bbox' not in obj:
                continue
                
            bbox = obj['bbox']
            x1, y1, x2, y2 = [int(coord) for coord in bbox]
            
            # Get threat level and corresponding color
            threat_level = obj.get('threat_level', 'LOW')
            color = colors.get(threat_level, (255, 255, 255))  # Default to white
            
            # Draw bounding box with thickness based on threat level
            thickness = 1
            if threat_level == 'MEDIUM':
                thickness = 2
            elif threat_level == 'HIGH':
                thickness = 3
                
            cv2.rectangle(vis_frame, (x1, y1), (x2, y2), color, thickness)
            
            # Draw object type and track ID
            obj_type = obj.get('type', 'unknown')
            label = f"{obj_type} ({track_id}) - {threat_level}"
            cv2.putText(vis_frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            
            # Draw behavior if available
            if 'behavior' in obj:
                behavior_label = f"Behavior: {obj['behavior']}"
                cv2.putText(vis_frame, behavior_label, (x1, y2+15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            # Draw movement pattern if available
            if 'movement_pattern' in obj:
                pattern_label = f"Pattern: {obj['movement_pattern']}"
                cv2.putText(vis_frame, pattern_label, (x1, y2+30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            
            # Draw tracking history if available and requested
            if show_history and hasattr(self, 'tracking_history') and track_id in self.tracking_history:
                history = self.tracking_history[track_id][-10:]  # Last 10 positions
                
                # Draw history as a trail of points
                for i in range(1, len(history)):
                    if 'bbox' in history[i] and 'bbox' in history[i-1]:
                        # Calculate centers
                        bbox1 = history[i-1]['bbox']
                        bbox2 = history[i]['bbox']
                        
                        center1 = (int((bbox1[0] + bbox1[2]) / 2), int((bbox1[1] + bbox1[3]) / 2))
                        center2 = (int((bbox2[0] + bbox2[2]) / 2), int((bbox2[1] + bbox2[3]) / 2))
                        
                        # Draw line between consecutive positions
                        cv2.line(vis_frame, center1, center2, color, 1)
                        
                        # Draw point at each position
                        cv2.circle(vis_frame, center2, 2, color, -1)
            
            # Draw predicted future positions if available and requested
            if show_predictions and 'predicted_positions' in obj:
                predictions = obj['predicted_positions']
                
                # Get current center position
                center_x = int((x1 + x2) / 2)
                center_y = int((y1 + y2) / 2)
                current_pos = (center_x, center_y)
                
                # Draw predictions as a line with points
                for i, (pred_x, pred_y, _) in enumerate(predictions):
                    pred_pos = (int(pred_x), int(pred_y))
                    
                    # Draw line from current position to first prediction,
                    # or from previous prediction to current prediction
                    if i == 0:
                        cv2.line(vis_frame, current_pos, pred_pos, (255, 0, 255), 1, cv2.LINE_DASH)
                    else:
                        prev_pos = (int(predictions[i-1][0]), int(predictions[i-1][1]))
                        cv2.line(vis_frame, prev_pos, pred_pos, (255, 0, 255), 1, cv2.LINE_DASH)
                    
                    # Draw point at predicted position
                    cv2.circle(vis_frame, pred_pos, 3, (255, 0, 255), -1)
        
        # Add legend for threat levels
        legend_y = 30
        for level, color in colors.items():
            cv2.putText(vis_frame, f"{level} Threat", (10, legend_y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            legend_y += 20
        
        return vis_frame
    
    def get_visualization_frame(self):
        """Get the latest visualization frame with tracked objects and threat levels
        
        Returns:
            frame: The latest visualization frame, or None if no visualization is available
        """
        if hasattr(self, 'latest_visualization') and self.latest_visualization is not None:
            return self.latest_visualization.copy()
        return None
    
    def save_visualization_frame(self, output_path):
        """Save the latest visualization frame to a file
        
        Args:
            output_path: Path to save the visualization frame
            
        Returns:
            bool: True if the frame was saved successfully, False otherwise
        """
        if hasattr(self, 'latest_visualization') and self.latest_visualization is not None:
            try:
                cv2.imwrite(output_path, self.latest_visualization)
                return True
            except Exception as e:
                print(f"Error saving visualization frame: {e}")
        return False
    
    def determine_threat_level(self, class_name, confidence, source='visual', behavior=None, movement_pattern=None):
        """Determine threat level based on class, confidence, behavior, and movement patterns
        
        Args:
            class_name: Detected object class
            confidence: Detection confidence score
            source: Detection source ('visual', 'thermal', 'radar', etc.)
            behavior: Optional behavior classification
            movement_pattern: Optional movement pattern classification
            
        Returns:
            str: Threat level ('LOW', 'MEDIUM', 'HIGH')
        """
        # Military-specific threat classification
        high_threat_classes = ['tank', 'military_vehicle', 'armed_person', 'missile', 'aircraft', 'drone', 'weapon']
        medium_threat_classes = ['person', 'vehicle', 'truck', 'boat', 'helicopter']
        low_threat_classes = ['civilian', 'animal', 'bicycle', 'car']
        
        # Base threat score calculation
        threat_score = 0.0
        
        # 1. Class-based scoring
        if class_name in high_threat_classes:
            threat_score += 0.7
        elif class_name in medium_threat_classes:
            threat_score += 0.4
        elif class_name in low_threat_classes:
            threat_score += 0.1
        else:
            threat_score += 0.2  # Unknown classes get a moderate-low score
        
        # 2. Confidence adjustment
        confidence_factor = min(1.0, confidence)
        threat_score *= (0.5 + 0.5 * confidence_factor)  # Scale by confidence, but maintain at least 50% of base score
        
        # 3. Source-based adjustment
        source_multipliers = {
            'visual': 1.0,
            'thermal': 1.2,  # Thermal detections are more significant
            'radar': 1.1,    # Radar detections are also more significant
            'lidar': 1.0,
            'acoustic': 0.9   # Acoustic detections are less reliable
        }
        threat_score *= source_multipliers.get(source, 1.0)
        
        # 4. Behavior-based adjustment
        if behavior is not None:
            behavior_multipliers = {
                'stationary': 0.8,
                'moving': 1.0,
                'approaching': 1.3,
                'fleeing': 1.1,
                'circling': 1.2,
                'erratic': 1.4,
                'aggressive': 1.6
            }
            threat_score *= behavior_multipliers.get(behavior, 1.0)
        
        # 5. Movement pattern adjustment
        if movement_pattern is not None:
            pattern_multipliers = {
                'linear': 1.0,
                'random': 0.9,
                'circular': 1.1,
                'zigzag': 1.3,  # Evasive movement
                'coordinated': 1.5  # Coordinated with other objects
            }
            threat_score *= pattern_multipliers.get(movement_pattern, 1.0)
        
        # 6. Apply contextual adjustments from class-specific rules
        threat_score = self.apply_contextual_threat_rules(class_name, threat_score)
        
        # Convert final score to threat level
        if threat_score >= 0.7:
            return 'HIGH'
        elif threat_score >= 0.4:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def apply_contextual_threat_rules(self, class_name, base_score):
        """Apply contextual rules to adjust threat scores based on specific object types
        
        Args:
            class_name: Object class name
            base_score: Initial threat score
            
        Returns:
            float: Adjusted threat score
        """
        # Time-based factors (e.g., night time might increase certain threat scores)
        current_hour = datetime.now().hour
        night_time = current_hour < 6 or current_hour > 20
        
        # Get current mission context if available
        mission_context = self.swarm_state.get('mission_status', 'idle')
        
        # Apply class-specific contextual rules
        if class_name == 'person':
            # Person at night is more suspicious
            if night_time:
                base_score *= 1.2
            
            # In high-security missions, unknown persons are higher threats
            if mission_context in ['high_security', 'restricted_area']:
                base_score *= 1.3
                
        elif class_name == 'vehicle':
            # Vehicles at night in certain contexts are more suspicious
            if night_time and mission_context in ['border_patrol', 'high_security']:
                base_score *= 1.3
                
        elif class_name == 'drone':
            # Enemy drones are always high threat in any context
            base_score = max(base_score, 0.7)
            
            # In no-fly zones, any drone is high threat
            if mission_context in ['no_fly_zone', 'restricted_airspace']:
                base_score = max(base_score, 0.8)
                
        elif class_name == 'aircraft':
            # Low-flying aircraft in restricted areas are higher threat
            if mission_context in ['restricted_airspace', 'high_security']:
                base_score *= 1.4
        
        # Apply environmental context if available
        if hasattr(self, 'environment_context'):
            env_context = self.environment_context
            
            # In urban environments, reduce threat level of common objects
            if env_context == 'urban' and class_name in ['person', 'car', 'bicycle']:
                base_score *= 0.8
                
            # In military zones, increase threat level of all objects
            elif env_context == 'military_zone':
                base_score *= 1.2
                
            # In border areas, increase threat level of vehicles and groups
            elif env_context == 'border' and class_name in ['vehicle', 'truck', 'group']:
                base_score *= 1.3
        
        # Cap the final score at 1.0
        return min(1.0, base_score)
    
    def classify_threat_behavior(self, track_history, current_detection):
        """Classify the behavior of a tracked threat based on its movement history
        
        Args:
            track_history: Historical tracking data for the object
            current_detection: Current detection data
            
        Returns:
            str: Behavior classification
        """
        if not track_history or len(track_history) < 3:
            return None
        
        # Extract position history
        positions = []
        for track in track_history[-10:]:  # Use up to 10 most recent positions
            if 'bbox' in track:
                bbox = track['bbox']
                center_x = (bbox[0] + bbox[2]) / 2
                center_y = (bbox[1] + bbox[3]) / 2
                positions.append((center_x, center_y))
        
        if len(positions) < 3:
            return None
        
        # Calculate velocities between consecutive positions
        velocities = []
        for i in range(1, len(positions)):
            p1 = positions[i-1]
            p2 = positions[i]
            dx = p2[0] - p1[0]
            dy = p2[1] - p1[1]
            velocities.append((dx, dy))
        
        # Calculate speed and direction changes
        speeds = [np.sqrt(vx**2 + vy**2) for vx, vy in velocities]
        avg_speed = sum(speeds) / len(speeds)
        
        # Calculate direction changes
        direction_changes = []
        for i in range(1, len(velocities)):
            v1 = velocities[i-1]
            v2 = velocities[i]
            
            # Calculate angle between vectors
            dot_product = v1[0]*v2[0] + v1[1]*v2[1]
            mag1 = np.sqrt(v1[0]**2 + v1[1]**2)
            mag2 = np.sqrt(v2[0]**2 + v2[1]**2)
            
            if mag1 > 0 and mag2 > 0:  # Avoid division by zero
                cos_angle = dot_product / (mag1 * mag2)
                # Clamp to avoid numerical errors
                cos_angle = max(-1, min(1, cos_angle))
                angle_rad = np.arccos(cos_angle)
                direction_changes.append(np.degrees(angle_rad))
        
        avg_direction_change = sum(direction_changes) / max(1, len(direction_changes))
        max_direction_change = max(direction_changes) if direction_changes else 0
        
        # Check if object is approaching our position (simplified)
        approaching = False
        if hasattr(self, 'position_history') and self.position_history:
            our_position = self.position_history[-1]['position'][:2]  # x, y coordinates
            
            # Calculate distance to our position for first and last object position
            first_dist = np.sqrt((positions[0][0] - our_position[0])**2 + (positions[0][1] - our_position[1])**2)
            last_dist = np.sqrt((positions[-1][0] - our_position[0])**2 + (positions[-1][1] - our_position[1])**2)
            
            # If distance is decreasing, object is approaching
            approaching = last_dist < first_dist and (first_dist - last_dist) > 10
        
        # Classify behavior based on movement patterns
        if avg_speed < 1.0:
            behavior = 'stationary'
        elif approaching:
            behavior = 'approaching'
        elif avg_direction_change > 45 or max_direction_change > 90:
            behavior = 'erratic'
        elif avg_direction_change > 20:
            behavior = 'circling'
        elif avg_speed > 20:
            behavior = 'fleeing' if not approaching else 'aggressive'
        else:
            behavior = 'moving'
        
        return behavior
    
    def target_handoff(self, current_drone_id, target_id, target_location, target_metadata):
        """Autonomous target handoff to nearest drone with better view
        
        Args:
            current_drone_id: ID of the drone currently tracking the target
            target_id: ID of the target being tracked
            target_location: [lat, lng, altitude] of target
            target_metadata: Additional target information
            
        Returns:
            Dict with handoff status and selected drone ID
        """
        # Get available drones from swarm state
        available_drones = [drone_id for drone_id, drone in self.swarm_state['drones'].items() 
                           if drone_id != current_drone_id and drone.get('status') == 'active']
        
        if not available_drones:
            return {'status': 'failed', 'reason': 'no_available_drones'}
        
        # Calculate best drone for handoff based on position and camera orientation
        best_drone = None
        best_score = -1
        
        for drone_id in available_drones:
            drone = self.swarm_state['drones'][drone_id]
            
            # Calculate distance to target
            drone_location = drone.get('location', [0, 0, 0])
            distance = self.calculate_distance(drone_location, target_location)
            
            # Calculate viewing angle
            drone_orientation = drone.get('orientation', [0, 0, 0])
            view_score = self.calculate_view_score(drone_location, drone_orientation, target_location)
            
            # Combined score (lower distance and higher view score is better)
            score = view_score * (1000 / (distance + 10))  # Avoid division by zero
            
            if score > best_score:
                best_score = score
                best_drone = drone_id
        
        if best_drone:
            # Prepare handoff data
            handoff_data = {
                'target_id': target_id,
                'location': target_location,
                'metadata': target_metadata,
                'handoff_time': datetime.now().isoformat(),
                'source_drone': current_drone_id
            }
            
            # Update swarm state
            if 'targets' not in self.swarm_state['drones'][best_drone]:
                self.swarm_state['drones'][best_drone]['targets'] = {}
            
            self.swarm_state['drones'][best_drone]['targets'][target_id] = handoff_data
            
            return {
                'status': 'success',
                'selected_drone': best_drone,
                'handoff_data': handoff_data
            }
        else:
            return {'status': 'failed', 'reason': 'no_suitable_drone'}
    
    def calculate_distance(self, point1, point2):
        """Calculate 3D distance between two points"""
        return np.sqrt(sum((a - b) ** 2 for a, b in zip(point1, point2)))
    
    def calculate_view_score(self, drone_location, drone_orientation, target_location):
        """Calculate how good the viewing angle is for a drone to a target"""
        # Simple implementation - can be enhanced with actual camera FOV calculations
        # Higher score means better view
        return random.uniform(0.5, 1.0)  # Placeholder for actual calculation
    
    def fuse_sensor_data(self):
        """Fuse data from multiple sensors using Extended Kalman Filter"""
        # Initialize state if not already done
        if not hasattr(self, 'ekf'):
            # State: [x, y, z, vx, vy, vz]
            self.ekf = ExtendedKalmanFilter(dim_x=6, dim_z=3)
            self.ekf.x = np.array([0., 0., 0., 0., 0., 0.])  # Initial state
            self.ekf.F = np.array([  # State transition matrix
                [1., 0., 0., 1., 0., 0.],
                [0., 1., 0., 0., 1., 0.],
                [0., 0., 1., 0., 0., 1.],
                [0., 0., 0., 1., 0., 0.],
                [0., 0., 0., 0., 1., 0.],
                [0., 0., 0., 0., 0., 1.]
            ])
            self.ekf.H = np.array([  # Measurement function
                [1., 0., 0., 0., 0., 0.],
                [0., 1., 0., 0., 0., 0.],
                [0., 0., 1., 0., 0., 0.]
            ])
            self.ekf.P *= 1000.  # Initial uncertainty
            self.ekf.R = np.eye(3) * 0.1  # Measurement uncertainty
            self.ekf.Q = np.eye(6) * 0.01  # Process uncertainty
        
        # Update with GPS data if available
        if self.sensor_data['gps'] is not None:
            gps_data = np.array(self.sensor_data['gps'][:3])  # [lat, lng, alt]
            self.ekf.predict()
            self.ekf.update(gps_data)
        
        # Update with IMU data if available
        if self.sensor_data['imu'] is not None:
            # Use IMU data to improve velocity estimates
            imu_data = self.sensor_data['imu']
            # This is simplified - real implementation would use orientation and acceleration
            pass
        
        # Update with LiDAR data if available
        if self.sensor_data['lidar'] is not None:
            # Use LiDAR for obstacle detection and mapping
            lidar_data = self.sensor_data['lidar']
            # Process LiDAR point cloud
            pass
        
        # Return fused state estimate
        return {
            'position': self.ekf.x[:3].tolist(),
            'velocity': self.ekf.x[3:].tolist(),
            'uncertainty': np.diag(self.ekf.P).tolist()
        }
    
    def update_sensor_data(self, sensor_type, data):
        """Update sensor data for fusion
        
        Args:
            sensor_type: One of 'gps', 'imu', 'thermal', 'lidar', 'radar', 'visual'
            data: Sensor data in appropriate format
        """
        if sensor_type in self.sensor_data:
            self.sensor_data[sensor_type] = data
            return True
        return False
    
    def check_for_events(self):
        """Check for events that should trigger drone awakening or alerts
        
        Returns:
            dict: Event data if detected, None otherwise
        """
        # Check sound levels (simulated)
        sound_level = random.uniform(50, 100)  # dB
        if sound_level > self.event_thresholds['sound']:
            return {'event': 'sound_trigger', 'level': sound_level, 'timestamp': time.time()}
        
        # Check thermal anomalies (simulated)
        if self.sensor_data['thermal'] is not None:
            max_temp = random.uniform(20, 50)  # degrees C
            if max_temp > self.event_thresholds['thermal']:
                return {'event': 'thermal_trigger', 'temperature': max_temp, 'timestamp': time.time()}
        
        # Check for coordinated threats (multiple threats moving in patterns)
        coordinated_threats = self.detect_coordinated_threats()
        if coordinated_threats:
            return {'event': 'coordinated_threat', 'threats': coordinated_threats, 'timestamp': time.time()}
        
        # Check for rapid movement patterns
        if hasattr(self, 'tracked_objects') and self.tracked_objects:
            rapid_movements = self.detect_rapid_movements()
            if rapid_movements:
                return {'event': 'rapid_movement', 'movements': rapid_movements, 'timestamp': time.time()}
        
        return None
        
    def detect_coordinated_threats(self):
        """Detect potentially coordinated threats by analyzing movement patterns
        
        Returns:
            list: Coordinated threat groups if detected, empty list otherwise
        """
        if not hasattr(self, 'tracked_objects') or not self.tracked_objects:
            return []
        
        # Need at least 3 tracked objects to detect coordination
        if len(self.tracked_objects) < 3:
            return []
        
        # Extract recent positions for each tracked object
        object_positions = {}
        object_velocities = {}
        current_time = time.time()
        
        for track_id, track_data in self.tracked_objects.items():
            if not isinstance(track_data, list) or len(track_data) < 3:
                continue
                
            # Get recent positions (last 3 points)
            recent_positions = []
            for point in track_data[-3:]:
                if 'bbox' in point:
                    # Calculate center point of bounding box
                    bbox = point['bbox']
                    center_x = (bbox[0] + bbox[2]) / 2
                    center_y = (bbox[1] + bbox[3]) / 2
                    recent_positions.append((center_x, center_y))
            
            if len(recent_positions) >= 2:
                object_positions[track_id] = recent_positions
                
                # Calculate velocity vector (from second-to-last to last position)
                p1 = recent_positions[-2]
                p2 = recent_positions[-1]
                velocity = (p2[0] - p1[0], p2[1] - p1[1])
                object_velocities[track_id] = velocity
        
        # Need at least 3 objects with valid positions
        if len(object_positions) < 3:
            return []
        
        # Detect formation patterns
        formations = self.detect_formations(object_positions)
        
        # Detect velocity alignment (objects moving in same direction)
        aligned_groups = self.detect_velocity_alignment(object_velocities)
        
        # Combine formation and velocity information
        coordinated_groups = []
        
        # If objects are both in formation and moving in aligned directions
        for formation in formations:
            # Check if majority of formation members are also velocity-aligned
            for aligned_group in aligned_groups:
                common_members = set(formation).intersection(set(aligned_group))
                if len(common_members) >= min(2, len(formation) // 2):
                    # This is likely a coordinated group
                    coordinated_groups.append({
                        'members': list(formation),
                        'formation_type': 'linear' if len(formation) > 3 else 'cluster',
                        'movement_aligned': True,
                        'confidence': 0.8,
                        'detection_time': current_time
                    })
        
        # Also include large formations even without aligned movement
        for formation in formations:
            if len(formation) >= 4 and not any(set(formation).issubset(set(g['members'])) for g in coordinated_groups):
                coordinated_groups.append({
                    'members': list(formation),
                    'formation_type': 'large_formation',
                    'movement_aligned': False,
                    'confidence': 0.6,
                    'detection_time': current_time
                })
        
        return coordinated_groups
    
    def detect_formations(self, object_positions):
        """Detect if objects are moving in formation patterns
        
        Args:
            object_positions: Dictionary of object IDs to position lists
            
        Returns:
            list: Groups of objects in formations
        """
        # Extract the latest position for each object
        latest_positions = {obj_id: positions[-1] for obj_id, positions in object_positions.items()}
        
        # Convert to format suitable for clustering
        points = np.array(list(latest_positions.values()))
        ids = list(latest_positions.keys())
        
        # Use DBSCAN to find clusters (formations)
        if len(points) >= 3:  # Need at least 3 points for meaningful clustering
            try:
                # Normalize points to avoid scale issues
                scaler = StandardScaler()
                scaled_points = scaler.fit_transform(points)
                
                # Run DBSCAN clustering
                clustering = DBSCAN(eps=0.5, min_samples=2).fit(scaled_points)
                
                # Extract clusters (ignoring noise points labeled as -1)
                formations = []
                for cluster_id in set(clustering.labels_):
                    if cluster_id != -1:  # Ignore noise points
                        cluster_indices = np.where(clustering.labels_ == cluster_id)[0]
                        if len(cluster_indices) >= 2:  # At least 2 objects in formation
                            formation = [ids[i] for i in cluster_indices]
                            formations.append(formation)
                
                return formations
            except Exception as e:
                print(f"Error in formation detection: {e}")
        
        return []
    
    def detect_velocity_alignment(self, object_velocities):
        """Detect if objects are moving in the same direction
        
        Args:
            object_velocities: Dictionary of object IDs to velocity vectors
            
        Returns:
            list: Groups of objects moving in aligned directions
        """
        if len(object_velocities) < 2:
            return []
        
        # Function to calculate angle between two velocity vectors
        def angle_between(v1, v2):
            dot_product = v1[0]*v2[0] + v1[1]*v2[1]
            mag1 = np.sqrt(v1[0]**2 + v1[1]**2)
            mag2 = np.sqrt(v2[0]**2 + v2[1]**2)
            
            # Avoid division by zero
            if mag1 == 0 or mag2 == 0:
                return 90  # Perpendicular by default
                
            cos_angle = dot_product / (mag1 * mag2)
            # Clamp to avoid numerical errors
            cos_angle = max(-1, min(1, cos_angle))
            angle_rad = np.arccos(cos_angle)
            return np.degrees(angle_rad)
        
        # Find groups of objects moving in similar directions
        aligned_groups = []
        processed_ids = set()
        
        for obj_id, velocity in object_velocities.items():
            if obj_id in processed_ids:
                continue
                
            # Skip objects that are nearly stationary
            speed = np.sqrt(velocity[0]**2 + velocity[1]**2)
            if speed < 0.5:  # Minimum speed threshold
                continue
                
            # Find objects moving in similar direction
            aligned_with_current = [obj_id]
            
            for other_id, other_velocity in object_velocities.items():
                if other_id == obj_id or other_id in processed_ids:
                    continue
                    
                other_speed = np.sqrt(other_velocity[0]**2 + other_velocity[1]**2)
                if other_speed < 0.5:  # Skip nearly stationary objects
                    continue
                    
                # Check if directions are aligned (angle less than 30 degrees)
                if angle_between(velocity, other_velocity) < 30:
                    aligned_with_current.append(other_id)
            
            # If we found at least one other object moving in the same direction
            if len(aligned_with_current) > 1:
                aligned_groups.append(aligned_with_current)
                processed_ids.update(aligned_with_current)
        
        return aligned_groups
    
    def detect_rapid_movements(self):
        """Detect rapid or evasive movements in tracked objects
        
        Returns:
            list: Objects with rapid movement patterns
        """
        rapid_movements = []
        
        for track_id, track_data in self.tracked_objects.items():
            if not isinstance(track_data, list) or len(track_data) < 4:
                continue
                
            # Extract recent positions
            recent_positions = []
            for point in track_data[-4:]:
                if 'bbox' in point:
                    bbox = point['bbox']
                    center_x = (bbox[0] + bbox[2]) / 2
                    center_y = (bbox[1] + bbox[3]) / 2
                    recent_positions.append((center_x, center_y))
            
            if len(recent_positions) < 4:
                continue
                
            # Calculate speeds between consecutive points
            speeds = []
            for i in range(1, len(recent_positions)):
                p1 = recent_positions[i-1]
                p2 = recent_positions[i]
                distance = np.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
                speeds.append(distance)
            
            # Calculate acceleration (change in speed)
            accelerations = [speeds[i] - speeds[i-1] for i in range(1, len(speeds))]
            
            # Calculate direction changes
            direction_changes = []
            for i in range(2, len(recent_positions)):
                v1 = (recent_positions[i-1][0] - recent_positions[i-2][0], 
                      recent_positions[i-1][1] - recent_positions[i-2][1])
                v2 = (recent_positions[i][0] - recent_positions[i-1][0], 
                      recent_positions[i][1] - recent_positions[i-1][1])
                
                # Calculate angle between vectors
                dot_product = v1[0]*v2[0] + v1[1]*v2[1]
                mag1 = np.sqrt(v1[0]**2 + v1[1]**2)
                mag2 = np.sqrt(v2[0]**2 + v2[1]**2)
                
                if mag1 > 0 and mag2 > 0:  # Avoid division by zero
                    cos_angle = dot_product / (mag1 * mag2)
                    # Clamp to avoid numerical errors
                    cos_angle = max(-1, min(1, cos_angle))
                    angle_rad = np.arccos(cos_angle)
                    direction_changes.append(np.degrees(angle_rad))
            
            # Detect rapid movement patterns
            max_speed = max(speeds) if speeds else 0
            max_acceleration = max(abs(a) for a in accelerations) if accelerations else 0
            max_direction_change = max(direction_changes) if direction_changes else 0
            
            # Thresholds for rapid movement detection
            if (max_speed > 20 or max_acceleration > 10 or max_direction_change > 60):
                # Extract object type from track_id
                object_type = track_id.split('_')[1] if '_' in track_id else 'unknown'
                
                rapid_movements.append({
                    'id': track_id,
                    'type': object_type,
                    'max_speed': max_speed,
                    'max_acceleration': max_acceleration,
                    'max_direction_change': max_direction_change,
                    'evasive_pattern': max_direction_change > 60,
                    'detection_time': time.time()
                })
        
        return rapid_movements
    
    def predict_obstacle_path(self, obstacle_id, current_position, current_velocity, time_horizon=5.0):
        """Predict future path of moving obstacle using Kalman Filter
        
        Args:
            obstacle_id: Unique ID of the obstacle
            current_position: [x, y, z] position
            current_velocity: [vx, vy, vz] velocity
            time_horizon: How many seconds to predict ahead
            
        Returns:
            List of predicted future positions
        """
        # Initialize Kalman filter for this obstacle if not exists
        if obstacle_id not in self.kalman_filters:
            kf = KalmanFilter(dim_x=6, dim_z=3)  # State: [x, y, z, vx, vy, vz]
            kf.x = np.array([*current_position, *current_velocity])  # Initial state
            kf.F = np.array([  # State transition matrix
                [1., 0., 0., 1., 0., 0.],
                [0., 1., 0., 0., 1., 0.],
                [0., 0., 1., 0., 0., 1.],
                [0., 0., 0., 1., 0., 0.],
                [0., 0., 0., 0., 1., 0.],
                [0., 0., 0., 0., 0., 1.]
            ])
            kf.H = np.array([  # Measurement function
                [1., 0., 0., 0., 0., 0.],
                [0., 1., 0., 0., 0., 0.],
                [0., 0., 1., 0., 0., 0.]
            ])
            kf.P *= 1000.  # Initial uncertainty
            kf.R = np.eye(3) * 0.1  # Measurement uncertainty
            kf.Q = np.eye(6) * 0.01  # Process uncertainty
            self.kalman_filters[obstacle_id] = kf
        else:
            # Update existing filter with new measurement
            kf = self.kalman_filters[obstacle_id]
            kf.predict()
            kf.update(np.array(current_position))
        
        # Predict future positions
        future_positions = []
        state = kf.x.copy()
        dt = 0.5  # Time step for prediction (seconds)
        steps = int(time_horizon / dt)
        
        for _ in range(steps):
            # Simple linear prediction
            state[0] += state[3] * dt  # x += vx * dt
            state[1] += state[4] * dt  # y += vy * dt
            state[2] += state[5] * dt  # z += vz * dt
            future_positions.append(state[:3].copy())
        
        return future_positions

    def get_current_threat_level(self):
        """Calculate the current overall threat level based on recent detections
        
        Returns:
            float: Normalized threat level between 0.0 (no threat) and 1.0 (maximum threat)
        """
        # If no threat history, return low threat level
        if not hasattr(self, 'threat_history') or not self.threat_history:
            return 0.1
        
        # Get most recent threat assessment
        recent_threats = []
        for history in reversed(self.threat_history[-5:]):
            if 'threats' in history:
                recent_threats.extend(history['threats'])
            if len(recent_threats) >= 10:
                break
        
        if not recent_threats:
            return 0.1
        
        # Calculate threat level based on threat levels and proximity
        threat_values = {
            'LOW': 0.2,
            'MEDIUM': 0.6,
            'HIGH': 1.0
        }
        
        # Sum up threat values
        threat_sum = sum(threat_values.get(threat.get('threat_level', 'LOW'), 0.1) for threat in recent_threats)
        
        # Normalize between 0 and 1
        normalized_threat = min(1.0, threat_sum / max(len(recent_threats), 1))
        
        return normalized_threat
    
    def analyze_current_threats(self):
        """Analyze current threats based on recent detections and sensor data
        
        Returns:
            list: Current threats with analysis
        """
        # In a real implementation, this would analyze actual sensor data
        # For simulation, we'll generate some sample threats
        current_threats = []
        
        # Use tracked objects if available
        if hasattr(self, 'tracked_objects') and self.tracked_objects:
            for track_id, track_data in self.tracked_objects.items():
                if not track_data:
                    continue
                    
                # Get the most recent tracking data
                recent_track = track_data[-1] if isinstance(track_data, list) else track_data
                
                # Extract object type from track_id (simplified)
                object_type = track_id.split('_')[1] if '_' in track_id else 'unknown'
                
                # Determine threat level based on object type
                threat_level = self.determine_threat_level(object_type, 0.8)
                
                # Create threat object
                threat = {
                    'id': track_id,
                    'type': object_type,
                    'position': recent_track.get('bbox', [0, 0, 100, 100]),
                    'threat_level': threat_level,
                    'timestamp': datetime.now().isoformat()
                }
                
                current_threats.append(threat)
        
        # If no tracked objects, generate some simulated threats for testing
        if not current_threats and random.random() < 0.3:  # 30% chance of random threat
            threat_types = ['person', 'vehicle', 'aircraft', 'tank', 'drone']
            threat_type = random.choice(threat_types)
            threat_level = self.determine_threat_level(threat_type, random.uniform(0.6, 0.9))
            
            threat = {
                'id': f"simulated_{int(time.time())}",
                'type': threat_type,
                'position': [random.uniform(0, 1000) for _ in range(4)],
                'threat_level': threat_level,
                'timestamp': datetime.now().isoformat()
            }
            
            current_threats.append(threat)
        
        return current_threats
    
    def generate_threat_alerts(self, threat_predictions):
        """Generate alerts for high-priority threats
        
        Args:
            threat_predictions: List of threat predictions
        """
        high_priority_threats = []
        
        for prediction in threat_predictions:
            # Check if this is a high-priority threat
            if prediction['current_threat'] == 'HIGH' or prediction['predicted_escalation'] > 0.7:
                high_priority_threats.append(prediction)
        
        if high_priority_threats:
            # In a real system, this would send alerts to operators or trigger automated responses
            alert_message = f"HIGH PRIORITY THREATS DETECTED: {len(high_priority_threats)}"
            print(f"[ALERT] {alert_message}")
            
            for i, threat in enumerate(high_priority_threats):
                print(f"  Threat {i+1}: {threat['object_id']} - {threat['current_threat']} level")
                print(f"    Escalation probability: {threat['predicted_escalation']:.2f}")
                print(f"    Time to critical: {threat['time_to_critical']:.1f} seconds")
                print(f"    Recommended action: {threat['recommended_action']}")
    
    def process_detected_event(self, event):
        """Process a detected environmental event
        
        Args:
            event: Event data dictionary
        """
        event_type = event.get('event')
        
        if event_type == 'sound_trigger':
            print(f"[EVENT] Sound event detected: {event.get('level')} dB")
            # Adjust threat assessment based on sound level
            if event.get('level', 0) > 90:  # Very loud sound
                # In a real system, this might trigger additional surveillance or alerts
                pass
                
        elif event_type == 'thermal_trigger':
            print(f"[EVENT] Thermal anomaly detected: {event.get('temperature')} °C")
            # Adjust threat assessment based on thermal signature
            if event.get('temperature', 0) > 45:  # Very hot object
                # This might indicate a vehicle, fire, or other heat source
                pass
        
        # Store event in history for pattern analysis
        if not hasattr(self, 'event_history'):
            self.event_history = []
            
        self.event_history.append({
            'timestamp': datetime.now().isoformat(),
            'event_type': event_type,
            'data': event
        })
        
        # Limit history size
        if len(self.event_history) > 100:
            self.event_history = self.event_history[-100:]
    
    def share_threat_data_with_swarm(self):
        """Share threat data with other drones in the swarm"""
        # In a real implementation, this would communicate with other drones
        # For simulation, we'll just prepare the data that would be shared
        
        # Only share if we have threat data
        if not hasattr(self, 'threat_history') or not self.threat_history:
            return
        
        # Get most recent threat assessment
        if self.threat_history:
            latest_threats = self.threat_history[-1].get('threats', [])
            
            if latest_threats:
                # Prepare data packet for sharing
                threat_data = {
                    'timestamp': datetime.now().isoformat(),
                    'source_drone': self.swarm_state.get('self_id', 'unknown'),
                    'threat_count': len(latest_threats),
                    'high_priority_count': sum(1 for t in latest_threats if t.get('threat_level') == 'HIGH'),
                    'threats': latest_threats
                }
                
                # In a real system, this would be sent to other drones
                # For simulation, we'll just print a message
                print(f"[SWARM] Sharing threat data: {threat_data['threat_count']} threats detected")

# Initialize the advanced AI system
advanced_ai = AdvancedMilitaryAI()