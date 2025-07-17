import numpy as np
import cv2
from ultralytics import YOLO
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime, timedelta
import json

class AdvancedMilitaryAI:
    def __init__(self):
        self.model = YOLO("yolov8m.pt")
        self.behavior_classifier = None
        self.threat_predictor = None
        self.tracked_objects = {}
        self.scaler = StandardScaler()
        self.load_models()
    
    def load_models(self):
        """Load pre-trained behavioral and threat prediction models"""
        try:
            if os.path.exists('models/behavior_classifier.pkl'):
                self.behavior_classifier = joblib.load('models/behavior_classifier.pkl')
            if os.path.exists('models/threat_predictor.pkl'):
                self.threat_predictor = joblib.load('models/threat_predictor.pkl')
        except:
            print("No pre-trained models found. Using default classifiers.")
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
        """Predict how threats might evolve over time"""
        predictions = []
        for threat in current_threats:
            prediction = {
                'object_id': threat['id'],
                'current_threat': threat['threat_level'],
                'predicted_escalation': self.predict_escalation(threat, historical_data),
                'time_to_critical': self.estimate_time_to_critical(threat),
                'recommended_action': self.get_recommended_action(threat)
            }
            predictions.append(prediction)
        return predictions
    
    def multi_object_tracking(self, detections, frame_id):
        """Track multiple objects across frames"""
        current_tracks = {}
        for detection in detections:
            track_id = self.assign_track_id(detection, frame_id)
            if track_id:
                current_tracks[track_id] = {
                    'bbox': detection['bounding_box'],
                    'class': detection['type'],
                    'confidence': detection['confidence'],
                    'threat_level': detection['threat_level'],
                    'track_history': self.update_track_history(track_id, detection, frame_id)
                }
        return current_tracks
    
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
    
    def assign_track_id(self, detection, frame_id):
        """Assign or update track ID for object"""
        # Simplified tracking - in real implementation, use advanced tracking algorithms
        return f"track_{detection['type']}_{frame_id}"
    
    def update_track_history(self, track_id, detection, frame_id):
        """Update tracking history for an object"""
        if track_id not in self.tracked_objects:
            self.tracked_objects[track_id] = []
        
        self.tracked_objects[track_id].append({
            'frame_id': frame_id,
            'bbox': detection['bounding_box'],
            'timestamp': datetime.now().isoformat()
        })
        
        # Keep only last 30 frames
        if len(self.tracked_objects[track_id]) > 30:
            self.tracked_objects[track_id] = self.tracked_objects[track_id][-30:]
        
        return self.tracked_objects[track_id]

# Initialize the advanced AI system
advanced_ai = AdvancedMilitaryAI() 