# sensor_fusion/fusion.py
# Microservice for sensor fusion (GPS, IMU, LiDAR, camera, thermal, radar)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import numpy as np
from filterpy.kalman import ExtendedKalmanFilter
import json
import time
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SensorData(BaseModel):
    drone_id: str
    timestamp: Optional[str] = None
    gps: Optional[List[float]] = None  # [lat, lon, alt]
    imu: Optional[List[float]] = None  # [roll, pitch, yaw, ax, ay, az]
    lidar: Optional[Dict[str, Any]] = None  # {distances: [], angles: [], intensities: []}
    camera: Optional[str] = None  # base64 or URL
    thermal: Optional[Dict[str, Any]] = None  # {temperatures: [], resolution: [width, height]}
    radar: Optional[Dict[str, Any]] = None  # {targets: [{range, velocity, angle}]}
    depth: Optional[Dict[str, Any]] = None  # {depth_map: [], resolution: [width, height]}

class FusionResult(BaseModel):
    drone_id: str
    timestamp: str
    position: List[float]  # [x, y, z]
    orientation: List[float]  # [roll, pitch, yaw]
    velocity: List[float]  # [vx, vy, vz]
    acceleration: List[float]  # [ax, ay, az]
    uncertainty: List[float]  # position and orientation uncertainty
    obstacles: Optional[List[Dict[str, Any]]] = None  # detected obstacles
    terrain_data: Optional[Dict[str, Any]] = None  # terrain information

# Global store for sensor data and Kalman filters
class SensorFusionSystem:
    def __init__(self):
        self.drone_filters = {}  # Kalman filters for each drone
        self.sensor_data = {}  # Latest sensor data for each drone
        self.fusion_results = {}  # Latest fusion results for each drone
    
    def get_or_create_filter(self, drone_id):
        """Get existing filter or create a new one for this drone"""
        if drone_id not in self.drone_filters:
            # Create Extended Kalman Filter for this drone
            # State vector: [x, y, z, roll, pitch, yaw, vx, vy, vz, ax, ay, az]
            ekf = ExtendedKalmanFilter(dim_x=12, dim_z=6)
            
            # Initialize state
            ekf.x = np.zeros(12)  # All zeros initially
            
            # State transition matrix (simplified linear model)
            dt = 0.1  # Time step
            ekf.F = np.eye(12)
            # Position updated by velocity
            ekf.F[0, 6] = dt
            ekf.F[1, 7] = dt
            ekf.F[2, 8] = dt
            # Velocity updated by acceleration
            ekf.F[6, 9] = dt
            ekf.F[7, 10] = dt
            ekf.F[8, 11] = dt
            
            # Measurement function (maps state to measurements)
            ekf.H = np.zeros((6, 12))
            # GPS measures position
            ekf.H[0, 0] = 1.0  # x
            ekf.H[1, 1] = 1.0  # y
            ekf.H[2, 2] = 1.0  # z
            # IMU measures orientation
            ekf.H[3, 3] = 1.0  # roll
            ekf.H[4, 4] = 1.0  # pitch
            ekf.H[5, 5] = 1.0  # yaw
            
            # Covariance matrices
            ekf.P = np.eye(12) * 1000  # Initial state uncertainty
            ekf.R = np.eye(6)  # Measurement uncertainty
            # GPS position uncertainty
            ekf.R[0, 0] = 5.0**2  # x (meters^2)
            ekf.R[1, 1] = 5.0**2  # y (meters^2)
            ekf.R[2, 2] = 10.0**2  # z (meters^2)
            # IMU orientation uncertainty
            ekf.R[3, 3] = 0.1**2  # roll (radians^2)
            ekf.R[4, 4] = 0.1**2  # pitch (radians^2)
            ekf.R[5, 5] = 0.2**2  # yaw (radians^2)
            
            # Process noise
            ekf.Q = np.eye(12) * 0.01
            # More uncertainty in acceleration
            ekf.Q[9:, 9:] = np.eye(3) * 0.1
            
            self.drone_filters[drone_id] = ekf
            self.sensor_data[drone_id] = {}
        
        return self.drone_filters[drone_id]
    
    def update_sensor_data(self, drone_id, sensor_type, data):
        """Update sensor data for a specific drone"""
        if drone_id not in self.sensor_data:
            self.sensor_data[drone_id] = {}
        
        self.sensor_data[drone_id][sensor_type] = data
        return True
    
    def fuse_sensors(self, drone_id):
        """Perform sensor fusion for a specific drone"""
        if drone_id not in self.sensor_data:
            return None
        
        # Get the Kalman filter for this drone
        ekf = self.get_or_create_filter(drone_id)
        
        # Predict step
        ekf.predict()
        
        # Update with GPS if available
        if 'gps' in self.sensor_data[drone_id] and self.sensor_data[drone_id]['gps']:
            gps_data = self.sensor_data[drone_id]['gps']
            # Convert GPS to local coordinates (simplified)
            position = np.array(gps_data[:3])
            ekf.update(np.concatenate([position, np.zeros(3)]))
        
        # Update with IMU if available
        if 'imu' in self.sensor_data[drone_id] and self.sensor_data[drone_id]['imu']:
            imu_data = self.sensor_data[drone_id]['imu']
            # Extract orientation and acceleration
            orientation = np.array(imu_data[:3])  # roll, pitch, yaw
            acceleration = np.array(imu_data[3:6])  # ax, ay, az
            
            # Update orientation directly
            ekf.x[3:6] = orientation
            # Update acceleration
            ekf.x[9:12] = acceleration
        
        # Process LiDAR data for obstacle detection
        obstacles = []
        if 'lidar' in self.sensor_data[drone_id] and self.sensor_data[drone_id]['lidar']:
            lidar_data = self.sensor_data[drone_id]['lidar']
            # Process LiDAR data to detect obstacles (simplified)
            if 'distances' in lidar_data and 'angles' in lidar_data:
                for i, (distance, angle) in enumerate(zip(lidar_data['distances'], lidar_data['angles'])):
                    if distance < 10.0:  # Only consider close obstacles
                        # Convert polar to cartesian coordinates
                        x = distance * np.cos(angle)
                        y = distance * np.sin(angle)
                        obstacles.append({
                            'id': f"obs_{i}",
                            'position': [float(x), float(y), 0.0],
                            'size': [1.0, 1.0, 1.0],  # Default size
                            'confidence': 0.8,
                            'source': 'lidar'
                        })
        
        # Process thermal data
        if 'thermal' in self.sensor_data[drone_id] and self.sensor_data[drone_id]['thermal']:
            thermal_data = self.sensor_data[drone_id]['thermal']
            # Process thermal data (simplified)
            # In a real implementation, this would detect heat signatures
            pass
        
        # Create fusion result
        result = {
            'drone_id': drone_id,
            'timestamp': datetime.now().isoformat(),
            'position': ekf.x[:3].tolist(),
            'orientation': ekf.x[3:6].tolist(),
            'velocity': ekf.x[6:9].tolist(),
            'acceleration': ekf.x[9:12].tolist(),
            'uncertainty': np.sqrt(np.diag(ekf.P)[:6]).tolist(),
            'obstacles': obstacles,
            'terrain_data': {}
        }
        
        # Store the result
        self.fusion_results[drone_id] = result
        
        return result

# Initialize the sensor fusion system
sensor_fusion_system = SensorFusionSystem()

@app.get("/health")
def health():
    return {"status": "ok", "service": "sensor_fusion"}

@app.post("/fuse-sensors")
async def fuse_sensors(sensor_data: SensorData):
    # Update the sensor data in our fusion system
    if sensor_data.gps:
        sensor_fusion_system.update_sensor_data(sensor_data.drone_id, 'gps', sensor_data.gps)
    
    if sensor_data.imu:
        sensor_fusion_system.update_sensor_data(sensor_data.drone_id, 'imu', sensor_data.imu)
    
    if sensor_data.lidar:
        sensor_fusion_system.update_sensor_data(sensor_data.drone_id, 'lidar', sensor_data.lidar)
    
    if sensor_data.thermal:
        sensor_fusion_system.update_sensor_data(sensor_data.drone_id, 'thermal', sensor_data.thermal)
    
    if sensor_data.radar:
        sensor_fusion_system.update_sensor_data(sensor_data.drone_id, 'radar', sensor_data.radar)
    
    if sensor_data.camera:
        sensor_fusion_system.update_sensor_data(sensor_data.drone_id, 'camera', sensor_data.camera)
    
    # Perform sensor fusion
    fusion_result = sensor_fusion_system.fuse_sensors(sensor_data.drone_id)
    
    if not fusion_result:
        return {"status": "error", "message": "Insufficient sensor data for fusion"}
    
    return {"status": "success", "fused_state": fusion_result}

@app.get("/fusion-status/{drone_id}")
async def get_fusion_status(drone_id: str):
    """Get the current fusion status for a specific drone"""
    if drone_id in sensor_fusion_system.fusion_results:
        return {"status": "success", "fusion_result": sensor_fusion_system.fusion_results[drone_id]}
    else:
        return {"status": "error", "message": f"No fusion data available for drone {drone_id}"}

@app.get("/obstacles/{drone_id}")
async def get_obstacles(drone_id: str):
    """Get detected obstacles for a specific drone"""
    if drone_id in sensor_fusion_system.fusion_results and 'obstacles' in sensor_fusion_system.fusion_results[drone_id]:
        return {"status": "success", "obstacles": sensor_fusion_system.fusion_results[drone_id]['obstacles']}
    else:
        return {"status": "error", "message": f"No obstacle data available for drone {drone_id}"}

@app.post("/predict-obstacle-path")
async def predict_obstacle_path(request: Dict[str, Any]):
    """Predict the future path of a moving obstacle using Kalman Filter"""
    if 'obstacle_id' not in request or 'drone_id' not in request:
        return {"status": "error", "message": "Missing obstacle_id or drone_id"}
    
    drone_id = request['drone_id']
    obstacle_id = request['obstacle_id']
    prediction_time = request.get('prediction_time', 5.0)  # seconds into future
    
    # Check if we have data for this drone
    if drone_id not in sensor_fusion_system.fusion_results:
        return {"status": "error", "message": f"No fusion data for drone {drone_id}"}
    
    # Find the obstacle
    obstacles = sensor_fusion_system.fusion_results[drone_id].get('obstacles', [])
    obstacle = None
    for obs in obstacles:
        if obs.get('id') == obstacle_id:
            obstacle = obs
            break
    
    if not obstacle:
        return {"status": "error", "message": f"Obstacle {obstacle_id} not found"}
    
    # In a real implementation, we would use a Kalman filter to predict the obstacle's future path
    # For this stub, we'll just return the current position with a small random offset
    current_position = obstacle.get('position', [0, 0, 0])
    predicted_position = [
        current_position[0] + np.random.normal(0, 0.5) * prediction_time,
        current_position[1] + np.random.normal(0, 0.5) * prediction_time,
        current_position[2]
    ]
    
    return {
        "status": "success",
        "obstacle_id": obstacle_id,
        "current_position": current_position,
        "predicted_position": predicted_position,
        "prediction_time": prediction_time,
        "confidence": 0.7  # Confidence in prediction (0-1)
    }

@app.post("/thermal-mapping")
async def create_thermal_map(request: Dict[str, Any]):
    """Generate a thermal map from thermal sensor data"""
    if 'drone_id' not in request or 'area_bounds' not in request:
        return {"status": "error", "message": "Missing drone_id or area_bounds"}
    
    drone_id = request['drone_id']
    area_bounds = request['area_bounds']  # [[min_x, min_y], [max_x, max_y]]
    resolution = request.get('resolution', [20, 20])  # [width, height] cells
    
    # Check if we have thermal data for this drone
    if drone_id not in sensor_fusion_system.sensor_data or 'thermal' not in sensor_fusion_system.sensor_data[drone_id]:
        return {"status": "error", "message": f"No thermal data for drone {drone_id}"}
    
    # In a real implementation, we would process the thermal data to create a heatmap
    # For this stub, we'll generate a random heatmap
    thermal_map = []
    for i in range(resolution[1]):
        row = []
        for j in range(resolution[0]):
            # Generate random temperature between 15-40°C with some spatial correlation
            base_temp = 20 + 10 * np.sin(i/resolution[1] * np.pi) * np.cos(j/resolution[0] * np.pi)
            temp = base_temp + np.random.normal(0, 2)
            row.append(float(temp))
        thermal_map.append(row)
    
    return {
        "status": "success",
        "drone_id": drone_id,
        "thermal_map": thermal_map,
        "area_bounds": area_bounds,
        "resolution": resolution,
        "timestamp": datetime.now().isoformat(),
        "unit": "celsius"
    }

@app.post("/weather-adaptation")
async def adapt_to_weather(request: Dict[str, Any]):
    """Provide flight adaptations based on current weather conditions"""
    if 'drone_id' not in request or 'weather_conditions' not in request:
        return {"status": "error", "message": "Missing drone_id or weather_conditions"}
    
    drone_id = request['drone_id']
    weather = request['weather_conditions']
    
    # Process weather conditions and recommend adaptations
    adaptations = []
    
    if 'wind_speed' in weather and weather['wind_speed'] > 15:  # m/s
        adaptations.append({
            "type": "speed_reduction",
            "value": min(0.7, 1 - (weather['wind_speed'] - 15) / 30),  # Reduce speed by up to 30%
            "reason": "High wind speed"
        })
    
    if 'wind_direction' in weather:
        adaptations.append({
            "type": "heading_adjustment",
            "value": weather['wind_direction'],  # Adjust heading to account for wind
            "reason": "Wind direction compensation"
        })
    
    if 'precipitation' in weather and weather['precipitation'] > 0.5:  # mm/h
        adaptations.append({
            "type": "altitude_increase",
            "value": min(50, weather['precipitation'] * 20),  # Increase altitude by up to 50m
            "reason": "Precipitation avoidance"
        })
    
    if 'visibility' in weather and weather['visibility'] < 1000:  # meters
        adaptations.append({
            "type": "return_to_base",
            "value": True,
            "reason": "Low visibility conditions"
        })
    
    return {
        "status": "success",
        "drone_id": drone_id,
        "weather_conditions": weather,
        "adaptations": adaptations,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)