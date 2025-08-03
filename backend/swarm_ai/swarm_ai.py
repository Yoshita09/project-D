# swarm_ai/swarm_ai.py
# Microservice for swarm AI: distributed task allocation, leader election, group key sync

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import time
import random
import uuid
import json
from datetime import datetime, timedelta

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskAssignment(BaseModel):
    drone_id: str
    task: str
    priority: int = 1  # 1-10, higher is more important
    requires_capabilities: List[str] = []  # e.g., ['thermal_camera', 'high_resolution']

class StatusReport(BaseModel):
    drone_id: str
    status: str  # 'active', 'idle', 'returning', 'offline', 'emergency'
    battery_level: float  # 0-100
    position: List[float]  # [lat, lon, alt]
    capabilities: List[str] = []  # e.g., ['thermal_camera', 'high_resolution']
    current_task: Optional[str] = None

class DroneSwarm(BaseModel):
    swarm_id: str
    drones: List[str]  # List of drone IDs
    leader_id: Optional[str] = None
    mission: Optional[str] = None
    formation: Optional[str] = None  # e.g., 'grid', 'v-shape', 'circle'
    status: str = 'active'  # 'active', 'standby', 'returning', 'emergency'

class SwarmHandoff(BaseModel):
    source_swarm_id: str
    target_swarm_id: str
    mission_data: Dict[str, Any]
    handoff_type: str = 'complete'  # 'complete', 'partial', 'emergency'

class EventTrigger(BaseModel):
    event_type: str  # 'sound', 'radar', 'intrusion', 'manual'
    location: Optional[List[float]] = None  # [lat, lon, alt]
    intensity: float = 0.0  # 0-1, higher is more intense
    timestamp: Optional[str] = None

# In-memory state
tasks = {}  # drone_id -> task details
drone_status = {}  # drone_id -> status report
swarms = {}  # swarm_id -> swarm details
leader_election_history = {}  # swarm_id -> list of past leaders
swarm_handoffs = []  # List of past handoffs
group_keys = {}  # swarm_id -> encryption key
heartbeats = {}  # drone_id -> last heartbeat time
role_assignments = {}  # drone_id -> role

# Consensus protocol state (simplified Raft)
term = 0  # Current term number
voted_for = None  # ID of candidate that received vote in current term
log = []  # Log entries

# Event-based awakening
sleeping_drones = {}  # drone_id -> sleep state
event_thresholds = {
    'sound': 0.7,  # Minimum intensity to trigger awakening
    'radar': 0.5,
    'intrusion': 0.3,
    'manual': 0.0  # Always trigger on manual events
}

def elect_leader(drone_ids: List[str], swarm_id: str = 'default'):
    """Elect a leader using a simplified Raft consensus algorithm"""
    global term
    
    if not drone_ids:
        return None
    
    # In a real implementation, this would involve voting and consensus
    # For this simplified version, we'll use capabilities and battery level
    
    # Get status of all drones in the swarm
    candidates = []
    for drone_id in drone_ids:
        if drone_id in drone_status:
            status = drone_status[drone_id]
            # Only consider active drones with good battery
            if status['status'] == 'active' and status.get('battery_level', 0) > 30:
                candidates.append({
                    'drone_id': drone_id,
                    'battery': status.get('battery_level', 0),
                    'capabilities': len(status.get('capabilities', [])),
                    'score': status.get('battery_level', 0) * 0.6 + len(status.get('capabilities', [])) * 0.4
                })
    
    # Sort by score (battery and capabilities)
    candidates.sort(key=lambda x: x['score'], reverse=True)
    
    # Increment term
    term += 1
    
    # Select the best candidate
    new_leader = candidates[0]['drone_id'] if candidates else min(drone_ids)
    
    # Record in history
    if swarm_id not in leader_election_history:
        leader_election_history[swarm_id] = []
    
    leader_election_history[swarm_id].append({
        'leader': new_leader,
        'term': term,
        'timestamp': datetime.now().isoformat(),
        'candidates': len(candidates)
    })
    
    # Update swarm leader
    if swarm_id in swarms:
        swarms[swarm_id].leader_id = new_leader
    
    return new_leader

@app.get("/health")
def health():
    return {"status": "ok", "service": "swarm_ai", "active_swarms": len(swarms)}

@app.post("/assign-task")
def assign_task(assignment: TaskAssignment):
    # Store the task assignment
    tasks[assignment.drone_id] = {
        "task": assignment.task,
        "priority": assignment.priority,
        "requires_capabilities": assignment.requires_capabilities,
        "assigned_at": datetime.now().isoformat()
    }
    
    # Update drone status if available
    if assignment.drone_id in drone_status:
        drone_status[assignment.drone_id]["current_task"] = assignment.task
    
    return {"assigned": True, "drone_id": assignment.drone_id, "task": assignment.task}

@app.post("/report-status")
def report_status(report: StatusReport):
    # Update drone status
    drone_status[report.drone_id] = report.dict()
    
    # Update heartbeat
    heartbeats[report.drone_id] = time.time()
    
    # Check if drone was sleeping and should be awakened
    if report.drone_id in sleeping_drones and report.status != "sleeping":
        sleeping_drones.pop(report.drone_id, None)
    
    return {"received": True, "drone_id": report.drone_id, "status": report.status}

@app.post("/elect-leader")
def leader_election_endpoint(drone_ids: List[str], swarm_id: str = "default"):
    leader = elect_leader(drone_ids, swarm_id)
    return {"leader": leader, "term": term, "swarm_id": swarm_id}

@app.get("/group-key/{swarm_id}")
def get_group_key(swarm_id: str = "default"):
    # Generate a new key if one doesn't exist
    if swarm_id not in group_keys:
        # In a real implementation, this would be a secure key generation
        group_keys[swarm_id] = f"KEY-{swarm_id}-{uuid.uuid4()}"
    
    return {"group_key": group_keys[swarm_id], "expires": (datetime.now() + timedelta(hours=24)).isoformat()}

# New endpoints for self-healing swarm logic
@app.post("/create-swarm")
def create_swarm(swarm: DroneSwarm):
    # Create a new swarm
    swarms[swarm.swarm_id] = swarm
    
    # Elect a leader if not specified
    if not swarm.leader_id and swarm.drones:
        swarm.leader_id = elect_leader(swarm.drones, swarm.swarm_id)
    
    # Generate a group key
    if swarm.swarm_id not in group_keys:
        group_keys[swarm.swarm_id] = f"KEY-{swarm.swarm_id}-{uuid.uuid4()}"
    
    return {"created": True, "swarm": swarm.dict()}

@app.get("/swarm/{swarm_id}")
def get_swarm(swarm_id: str):
    if swarm_id not in swarms:
        raise HTTPException(status_code=404, detail=f"Swarm {swarm_id} not found")
    
    return {"swarm": swarms[swarm_id].dict()}

@app.post("/redistribute-roles/{swarm_id}")
def redistribute_roles(swarm_id: str):
    """Self-healing: redistribute roles if a drone is lost"""
    if swarm_id not in swarms:
        raise HTTPException(status_code=404, detail=f"Swarm {swarm_id} not found")
    
    swarm = swarms[swarm_id]
    active_drones = []
    inactive_drones = []
    
    # Check which drones are active
    for drone_id in swarm.drones:
        if drone_id in drone_status and drone_status[drone_id]["status"] == "active":
            active_drones.append(drone_id)
        else:
            inactive_drones.append(drone_id)
    
    # If leader is inactive, elect a new one
    if swarm.leader_id in inactive_drones:
        swarm.leader_id = elect_leader(active_drones, swarm_id)
    
    # Redistribute roles
    new_roles = {}
    available_roles = ["mapper", "striker", "scout", "relay"]
    
    # First, collect roles that need reassignment
    orphaned_roles = []
    for drone_id, role in role_assignments.items():
        if drone_id in inactive_drones and drone_id in swarm.drones:
            orphaned_roles.append(role)
    
    # Assign orphaned roles to active drones without roles
    unassigned_drones = [d for d in active_drones if d not in role_assignments]
    
    for i, drone_id in enumerate(unassigned_drones):
        if i < len(orphaned_roles):
            new_roles[drone_id] = orphaned_roles[i]
        elif i < len(available_roles):
            new_roles[drone_id] = available_roles[i]
    
    # Update role assignments
    role_assignments.update(new_roles)
    
    return {
        "redistributed": True,
        "swarm_id": swarm_id,
        "active_drones": len(active_drones),
        "inactive_drones": len(inactive_drones),
        "new_leader": swarm.leader_id,
        "new_role_assignments": new_roles
    }

@app.post("/swarm-handoff")
def swarm_handoff(handoff: SwarmHandoff):
    """Handle swarm-to-swarm mission handoff"""
    if handoff.source_swarm_id not in swarms:
        raise HTTPException(status_code=404, detail=f"Source swarm {handoff.source_swarm_id} not found")
    
    if handoff.target_swarm_id not in swarms:
        raise HTTPException(status_code=404, detail=f"Target swarm {handoff.target_swarm_id} not found")
    
    # Record the handoff
    handoff_record = handoff.dict()
    handoff_record["timestamp"] = datetime.now().isoformat()
    swarm_handoffs.append(handoff_record)
    
    # Update target swarm with mission data
    target_swarm = swarms[handoff.target_swarm_id]
    target_swarm.mission = handoff.mission_data.get("mission")
    
    # If complete handoff, update source swarm status
    if handoff.handoff_type == "complete":
        source_swarm = swarms[handoff.source_swarm_id]
        source_swarm.status = "returning"
        source_swarm.mission = None
    
    return {
        "handoff_successful": True,
        "handoff_id": len(swarm_handoffs) - 1,
        "timestamp": handoff_record["timestamp"],
        "source_swarm": handoff.source_swarm_id,
        "target_swarm": handoff.target_swarm_id
    }

@app.post("/event-trigger")
def process_event_trigger(event: EventTrigger):
    """Process an event that might wake up sleeping drones"""
    if not event.timestamp:
        event.timestamp = datetime.now().isoformat()
    
    # Check if event intensity exceeds threshold
    threshold = event_thresholds.get(event.event_type, 1.0)
    if event.intensity >= threshold:
        # Wake up nearby sleeping drones
        awakened_drones = []
        
        for drone_id, sleep_state in list(sleeping_drones.items()):
            # In a real implementation, we would check distance to event
            # For this stub, we'll randomly decide
            if random.random() < 0.7:  # 70% chance to wake up
                # Wake up the drone
                if drone_id in drone_status:
                    drone_status[drone_id]["status"] = "active"
                
                # Remove from sleeping drones
                sleeping_drones.pop(drone_id)
                awakened_drones.append(drone_id)
        
        return {
            "event_processed": True,
            "event_type": event.event_type,
            "intensity": event.intensity,
            "threshold": threshold,
            "awakened_drones": awakened_drones,
            "timestamp": event.timestamp
        }
    else:
        return {
            "event_processed": True,
            "event_type": event.event_type,
            "intensity": event.intensity,
            "threshold": threshold,
            "awakened_drones": [],
            "message": "Event intensity below threshold"
        }

@app.post("/sleep-mode/{drone_id}")
def set_sleep_mode(drone_id: str, sleep: bool = True):
    """Put a drone into low-power sleep mode or wake it up"""
    if drone_id not in drone_status:
        raise HTTPException(status_code=404, detail=f"Drone {drone_id} not found")
    
    if sleep:
        # Put drone to sleep
        drone_status[drone_id]["status"] = "sleeping"
        sleeping_drones[drone_id] = {
            "sleep_time": datetime.now().isoformat(),
            "battery_level": drone_status[drone_id].get("battery_level", 0)
        }
        return {"sleep_mode": True, "drone_id": drone_id, "status": "sleeping"}
    else:
        # Wake up drone
        drone_status[drone_id]["status"] = "active"
        sleeping_drones.pop(drone_id, None)
        return {"sleep_mode": False, "drone_id": drone_id, "status": "active"}

@app.post("/drone-to-drone-transfer")
def drone_to_drone_transfer(request: Dict[str, Any]):
    """Simulate drone-to-drone file transfer when central link is lost"""
    source_drone = request.get("source_drone")
    target_drone = request.get("target_drone")
    data_type = request.get("data_type")  # 'ai_model', 'map', 'commands'
    data_size = request.get("data_size", 1024)  # KB
    
    if not source_drone or not target_drone or not data_type:
        raise HTTPException(status_code=400, detail="Missing required parameters")
    
    # Calculate transfer time based on data size (simulated)
    transfer_time = data_size / 1024  # Approx 1MB/s transfer rate
    
    # Record the transfer
    transfer_record = {
        "source_drone": source_drone,
        "target_drone": target_drone,
        "data_type": data_type,
        "data_size": data_size,
        "transfer_time": transfer_time,
        "timestamp": datetime.now().isoformat(),
        "success": True
    }
    
    return {
        "transfer_successful": True,
        "transfer_time": transfer_time,
        "source_drone": source_drone,
        "target_drone": target_drone,
        "data_type": data_type,
        "timestamp": transfer_record["timestamp"]
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 5700))
    uvicorn.run(app, host="0.0.0.0", port=port)