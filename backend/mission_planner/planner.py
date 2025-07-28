# mission_planner/planner.py
# Microservice for mission and path planning with dynamic path replanning, 3D SLAM, and weather adaptation

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
import json
import time
import random
from datetime import datetime
from filterpy.kalman import KalmanFilter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PathRequest(BaseModel):
    start: Tuple[float, float]
    goal: Tuple[float, float]
    obstacles: List[Dict[str, Any]] = []  # Now includes moving obstacles with velocity
    algorithm: str = "astar"  # or "rrt", "dijkstra"
    drone_id: Optional[str] = None
    consider_weather: bool = False
    indoor_mapping: bool = False

class DynamicPathRequest(BaseModel):
    drone_id: str
    current_position: Tuple[float, float, float]  # x, y, z
    goal: Tuple[float, float, float]
    obstacles: List[Dict[str, Any]]
    time_horizon: float = 5.0  # seconds to predict ahead

class SlamRequest(BaseModel):
    drone_id: str
    point_cloud: List[List[float]]  # List of [x, y, z] points
    drone_position: Tuple[float, float, float]
    drone_orientation: Tuple[float, float, float]  # roll, pitch, yaw

class WeatherData(BaseModel):
    wind_speed: float = 0.0  # m/s
    wind_direction: float = 0.0  # degrees
    precipitation: float = 0.0  # mm/h
    visibility: float = 10000.0  # meters
    temperature: float = 25.0  # Celsius

class MissionStateRequest(BaseModel):
    drone_id: str
    state: str
    position: Optional[Tuple[float, float, float]] = None
    battery_level: Optional[float] = None
    weather: Optional[WeatherData] = None

# In-memory storage for mission data
class MissionPlanner:
    def __init__(self):
        self.maps = {}  # 3D maps by drone_id
        self.paths = {}  # Current paths by drone_id
        self.obstacle_filters = {}  # Kalman filters for tracking moving obstacles
        self.mission_states = {}  # Current mission state by drone_id
        self.weather_conditions = {}  # Current weather by drone_id
    
    def get_or_create_obstacle_filter(self, obstacle_id):
        """Get existing Kalman filter or create a new one for this obstacle"""
        if obstacle_id not in self.obstacle_filters:
            # Create Kalman Filter for this obstacle
            # State: [x, y, z, vx, vy, vz]
            kf = KalmanFilter(dim_x=6, dim_z=3)
            kf.x = np.zeros(6)  # Initial state
            
            # State transition matrix (position updated by velocity)
            dt = 0.1  # Time step
            kf.F = np.array([
                [1., 0., 0., dt, 0., 0.],
                [0., 1., 0., 0., dt, 0.],
                [0., 0., 1., 0., 0., dt],
                [0., 0., 0., 1., 0., 0.],
                [0., 0., 0., 0., 1., 0.],
                [0., 0., 0., 0., 0., 1.]
            ])
            
            # Measurement function (measures position only)
            kf.H = np.array([
                [1., 0., 0., 0., 0., 0.],
                [0., 1., 0., 0., 0., 0.],
                [0., 0., 1., 0., 0., 0.]
            ])
            
            # Covariance matrices
            kf.P *= 1000.  # Initial uncertainty
            kf.R = np.eye(3) * 0.1  # Measurement uncertainty
            kf.Q = np.eye(6) * 0.01  # Process uncertainty
            
            self.obstacle_filters[obstacle_id] = kf
        
        return self.obstacle_filters[obstacle_id]

# Initialize mission planner
mission_planner = MissionPlanner()

@app.get("/health")
def health():
    return {
        "status": "ok", 
        "service": "mission_planner",
        "active_missions": len(mission_planner.mission_states),
        "3d_maps": len(mission_planner.maps)
    }

@app.post("/plan-path")
def plan_path(req: PathRequest):
    # Basic path planning with obstacle avoidance
    start_point = np.array(req.start)
    goal_point = np.array(req.goal)
    
    # Extract static obstacles
    static_obstacles = []
    for obs in req.obstacles:
        if 'velocity' not in obs or all(v == 0 for v in obs['velocity']):
            static_obstacles.append(np.array(obs['position'][:2]))
    
    # Choose algorithm
    if req.algorithm == "astar":
        path = astar_path(start_point, goal_point, static_obstacles)
    elif req.algorithm == "rrt":
        path = rrt_path(start_point, goal_point, static_obstacles)
    elif req.algorithm == "dijkstra":
        path = dijkstra_path(start_point, goal_point, static_obstacles)
    else:
        path = [req.start, req.goal]
    
    # Store path if drone_id is provided
    if req.drone_id:
        mission_planner.paths[req.drone_id] = {
            "path": path,
            "algorithm": req.algorithm,
            "timestamp": datetime.now().isoformat(),
            "obstacles": req.obstacles
        }
    
    # Apply weather adaptations if requested
    if req.consider_weather and req.drone_id and req.drone_id in mission_planner.weather_conditions:
        path = adapt_path_to_weather(path, mission_planner.weather_conditions[req.drone_id])
    
    return {"path": path, "algorithm": req.algorithm}

# Stub implementations of path planning algorithms
def astar_path(start, goal, obstacles):
    # A* implementation would go here
    # For now, just return a direct path with a midpoint to avoid obstacles
    midpoint = (start + goal) / 2
    midpoint[0] += random.uniform(-0.01, 0.01)  # Add some randomness
    midpoint[1] += random.uniform(-0.01, 0.01)
    return [start.tolist(), midpoint.tolist(), goal.tolist()]

def rrt_path(start, goal, obstacles):
    # RRT implementation would go here
    # For now, generate a path with multiple random waypoints
    path = [start.tolist()]
    current = start
    for _ in range(3):  # Generate 3 random waypoints
        direction = goal - current
        distance = np.linalg.norm(direction)
        step = direction / distance * min(distance, 0.4)  # Step size
        next_point = current + step
        # Add some randomness
        next_point[0] += random.uniform(-0.02, 0.02)
        next_point[1] += random.uniform(-0.02, 0.02)
        path.append(next_point.tolist())
        current = next_point
    path.append(goal.tolist())
    return path

def dijkstra_path(start, goal, obstacles):
    # Dijkstra implementation would go here
    # For now, just return a direct path
    return [start.tolist(), goal.tolist()]

def adapt_path_to_weather(path, weather):
    # Adapt path based on weather conditions
    adapted_path = path.copy()
    
    # If high winds, add more waypoints for finer control
    if weather.wind_speed > 15:
        new_path = []
        for i in range(len(path) - 1):
            new_path.append(path[i])
            # Add intermediate points
            mid = [(path[i][0] + path[i+1][0]) / 2, (path[i][1] + path[i+1][1]) / 2]
            new_path.append(mid)
        new_path.append(path[-1])
        adapted_path = new_path
    
    # If low visibility, simplify path
    if weather.visibility < 1000:
        # Just keep start and end points
        adapted_path = [path[0], path[-1]]
    
    return adapted_path

@app.post("/mission-state")
def mission_state(req: MissionStateRequest):
    # Update mission state
    mission_planner.mission_states[req.drone_id] = {
        "state": req.state,
        "position": req.position,
        "battery_level": req.battery_level,
        "timestamp": datetime.now().isoformat()
    }
    
    # Update weather conditions if provided
    if req.weather:
        mission_planner.weather_conditions[req.drone_id] = req.weather
    
    return {"drone_id": req.drone_id, "state": req.state, "status": "ok"}

@app.post("/dynamic-replan")
def dynamic_replan(req: DynamicPathRequest):
    """Dynamically replan path considering moving obstacles"""
    # Get current position and goal
    current_position = np.array(req.current_position)
    goal = np.array(req.goal)
    
    # Process obstacles and predict their future positions
    future_obstacle_positions = []
    for obstacle in req.obstacles:
        if 'id' in obstacle and 'position' in obstacle and 'velocity' in obstacle:
            obstacle_id = obstacle['id']
            position = np.array(obstacle['position'])
            velocity = np.array(obstacle['velocity'])
            
            # Update Kalman filter with new measurement
            kf = mission_planner.get_or_create_obstacle_filter(obstacle_id)
            kf.x[:3] = position  # Update position
            kf.x[3:] = velocity  # Update velocity
            kf.predict()
            
            # Predict future positions
            future_positions = []
            state = kf.x.copy()
            dt = 0.5  # Time step for prediction (seconds)
            steps = int(req.time_horizon / dt)
            
            for _ in range(steps):
                # Simple linear prediction
                state[0] += state[3] * dt  # x += vx * dt
                state[1] += state[4] * dt  # y += vy * dt
                state[2] += state[5] * dt  # z += vz * dt
                future_positions.append(state[:3].copy())
            
            future_obstacle_positions.append({
                "obstacle_id": obstacle_id,
                "current_position": position.tolist(),
                "future_positions": [pos.tolist() for pos in future_positions]
            })
    
    # Generate new path avoiding predicted obstacle positions
    # For simplicity, we'll just use RRT which is good for dynamic environments
    new_path = rrt_path(current_position[:2], goal[:2], [])
    
    # Store the new path
    mission_planner.paths[req.drone_id] = {
        "path": new_path,
        "algorithm": "rrt",
        "timestamp": datetime.now().isoformat(),
        "obstacles": req.obstacles
    }
    
    return {
        "status": "success",
        "path": new_path,
        "predicted_obstacles": future_obstacle_positions
    }

@app.post("/slam-update")
def slam_update(req: SlamRequest):
    """Update 3D SLAM map with new point cloud data"""
    drone_id = req.drone_id
    
    # Initialize map for this drone if it doesn't exist
    if drone_id not in mission_planner.maps:
        mission_planner.maps[drone_id] = {
            "point_cloud": [],
            "drone_trajectory": [],
            "floor_map": {},
            "last_update": None
        }
    
    # Add drone position to trajectory
    mission_planner.maps[drone_id]["drone_trajectory"].append({
        "position": req.drone_position,
        "orientation": req.drone_orientation,
        "timestamp": datetime.now().isoformat()
    })
    
    # Process point cloud data
    # In a real implementation, we would use RTAB-Map or ORB-SLAM3
    # For this stub, we'll just store the raw points
    mission_planner.maps[drone_id]["point_cloud"].extend(req.point_cloud)
    
    # Generate floor map (simplified)
    # Group points by height to identify floor plane
    floor_points = [p for p in req.point_cloud if abs(p[2] - req.drone_position[2] + 1.0) < 0.5]
    
    # Create a grid representation of the floor
    grid_size = 0.5  # meters per grid cell
    for point in floor_points:
        grid_x = int(point[0] / grid_size)
        grid_y = int(point[1] / grid_size)
        grid_key = f"{grid_x},{grid_y}"
        
        if grid_key not in mission_planner.maps[drone_id]["floor_map"]:
            mission_planner.maps[drone_id]["floor_map"][grid_key] = {
                "x": grid_x,
                "y": grid_y,
                "traversable": True,
                "points": []
            }
        
        mission_planner.maps[drone_id]["floor_map"][grid_key]["points"].append(point)
    
    mission_planner.maps[drone_id]["last_update"] = datetime.now().isoformat()
    
    return {
        "status": "success",
        "map_size": len(mission_planner.maps[drone_id]["point_cloud"]),
        "floor_cells": len(mission_planner.maps[drone_id]["floor_map"])
    }

@app.get("/slam-map/{drone_id}")
def get_slam_map(drone_id: str):
    """Get the current SLAM map for a drone"""
    if drone_id not in mission_planner.maps:
        raise HTTPException(status_code=404, detail=f"No SLAM map found for drone {drone_id}")
    
    # Return a simplified version of the map
    return {
        "drone_id": drone_id,
        "trajectory_points": len(mission_planner.maps[drone_id]["drone_trajectory"]),
        "point_cloud_size": len(mission_planner.maps[drone_id]["point_cloud"]),
        "floor_map_cells": len(mission_planner.maps[drone_id]["floor_map"]),
        "last_update": mission_planner.maps[drone_id]["last_update"]
    }

@app.get("/floor-map/{drone_id}")
def get_floor_map(drone_id: str):
    """Get the 2D floor map extracted from SLAM data"""
    if drone_id not in mission_planner.maps or not mission_planner.maps[drone_id]["floor_map"]:
        raise HTTPException(status_code=404, detail=f"No floor map found for drone {drone_id}")
    
    # Convert the floor map to a 2D grid representation
    floor_map = mission_planner.maps[drone_id]["floor_map"]
    grid_cells = list(floor_map.values())
    
    return {
        "drone_id": drone_id,
        "grid_cells": grid_cells,
        "cell_size": 0.5,  # meters
        "last_update": mission_planner.maps[drone_id]["last_update"]
    }

@app.post("/thermal-floor-map/{drone_id}")
def create_thermal_floor_map(drone_id: str, thermal_data: Dict[str, Any]):
    """Generate a thermal heatmap of the floor"""
    if drone_id not in mission_planner.maps:
        raise HTTPException(status_code=404, detail=f"No SLAM map found for drone {drone_id}")
    
    # In a real implementation, we would process thermal sensor data
    # For this stub, we'll generate random thermal values for the floor map
    floor_map = mission_planner.maps[drone_id]["floor_map"]
    
    # Add thermal data to each cell
    for grid_key, cell in floor_map.items():
        # Generate random temperature (20-40°C)
        cell["temperature"] = 20 + random.random() * 20
        
        # Mark cells with high temperature as potential threats
        cell["thermal_anomaly"] = cell["temperature"] > 35
    
    # Count thermal anomalies
    anomaly_count = sum(1 for cell in floor_map.values() if cell.get("thermal_anomaly", False))
    
    return {
        "status": "success",
        "drone_id": drone_id,
        "thermal_cells": len(floor_map),
        "anomalies": anomaly_count,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/weather-adaptation/{drone_id}")
def adapt_to_weather(drone_id: str, weather: WeatherData):
    """Adapt drone behavior based on weather conditions"""
    # Store the weather data
    mission_planner.weather_conditions[drone_id] = weather
    
    # Generate adaptations based on weather
    adaptations = []
    
    if weather.wind_speed > 15:  # m/s
        adaptations.append({
            "type": "speed_reduction",
            "value": min(0.7, 1 - (weather.wind_speed - 15) / 30),  # Reduce speed by up to 30%
            "reason": "High wind speed"
        })
    
    if weather.wind_direction is not None:
        adaptations.append({
            "type": "heading_adjustment",
            "value": weather.wind_direction,  # Adjust heading to account for wind
            "reason": "Wind direction compensation"
        })
    
    if weather.precipitation > 0.5:  # mm/h
        adaptations.append({
            "type": "altitude_increase",
            "value": min(50, weather.precipitation * 20),  # Increase altitude by up to 50m
            "reason": "Precipitation avoidance"
        })
    
    if weather.visibility < 1000:  # meters
        adaptations.append({
            "type": "return_to_base",
            "value": True,
            "reason": "Low visibility conditions"
        })
    
    # If drone has an active path, adapt it
    if drone_id in mission_planner.paths:
        current_path = mission_planner.paths[drone_id]["path"]
        adapted_path = adapt_path_to_weather(current_path, weather)
        mission_planner.paths[drone_id]["path"] = adapted_path
        mission_planner.paths[drone_id]["weather_adapted"] = True
    
    return {
        "status": "success",
        "drone_id": drone_id,
        "weather_conditions": weather.dict(),
        "adaptations": adaptations,
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)