import asyncio
import json
import websockets
from typing import Dict, Set, List
from datetime import datetime
import logging

class WebSocketManager:
    def __init__(self):
        self.connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.drone_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.frontend_connections: Set[websockets.WebSocketServerProtocol] = set()
        self.logger = logging.getLogger(__name__)
    
    async def register_connection(self, websocket, path):
        """Register a new WebSocket connection"""
        connection_id = f"conn_{len(self.connections)}"
        self.connections[connection_id] = websocket
        
        if path == "/drone":
            drone_id = await self.get_drone_id(websocket)
            self.drone_connections[drone_id] = websocket
            self.logger.info(f"Drone {drone_id} connected")
        elif path == "/frontend":
            self.frontend_connections.add(websocket)
            self.logger.info("Frontend connected")
        
        try:
            async for message in websocket:
                await self.handle_message(connection_id, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_connection(connection_id)
    
    async def get_drone_id(self, websocket):
        """Extract drone ID from connection"""
        # In real implementation, get from authentication
        return f"drone_{len(self.drone_connections)}"
    
    async def handle_message(self, connection_id, message):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if message_type == 'detection':
                await self.broadcast_detection(data)
            elif message_type == 'drone_status':
                await self.broadcast_drone_status(data)
            elif message_type == 'threat_alert':
                await self.broadcast_threat_alert(data)
            elif message_type == 'swarm_command':
                await self.broadcast_swarm_command(data)
            elif message_type == 'system_status':
                await self.broadcast_system_status(data)
            
        except json.JSONDecodeError:
            self.logger.error(f"Invalid JSON message: {message}")
        except Exception as e:
            self.logger.error(f"Error handling message: {e}")
    
    async def broadcast_detection(self, detection_data):
        """Broadcast detection results to all frontend clients"""
        message = {
            'type': 'detection_update',
            'timestamp': datetime.now().isoformat(),
            'data': detection_data
        }
        await self.broadcast_to_frontend(message)
    
    async def broadcast_drone_status(self, status_data):
        """Broadcast drone status updates"""
        message = {
            'type': 'drone_status_update',
            'timestamp': datetime.now().isoformat(),
            'data': status_data
        }
        await self.broadcast_to_frontend(message)
    
    async def broadcast_threat_alert(self, alert_data):
        """Broadcast threat alerts"""
        message = {
            'type': 'threat_alert',
            'timestamp': datetime.now().isoformat(),
            'data': alert_data
        }
        await self.broadcast_to_frontend(message)
        await self.broadcast_to_drones(message)
    
    async def broadcast_swarm_command(self, command_data):
        """Broadcast swarm commands to drones"""
        message = {
            'type': 'swarm_command',
            'timestamp': datetime.now().isoformat(),
            'data': command_data
        }
        await self.broadcast_to_drones(message)
    
    async def broadcast_system_status(self, status_data):
        """Broadcast system status updates"""
        message = {
            'type': 'system_status_update',
            'timestamp': datetime.now().isoformat(),
            'data': status_data
        }
        await self.broadcast_to_frontend(message)
    
    async def broadcast_to_frontend(self, message):
        """Send message to all frontend connections"""
        if not self.frontend_connections:
            return
        
        disconnected = set()
        for websocket in self.frontend_connections:
            try:
                await websocket.send(json.dumps(message))
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(websocket)
            except Exception as e:
                self.logger.error(f"Error sending to frontend: {e}")
                disconnected.add(websocket)
        
        # Remove disconnected clients
        self.frontend_connections -= disconnected
    
    async def broadcast_to_drones(self, message):
        """Send message to all drone connections"""
        if not self.drone_connections:
            return
        
        disconnected = []
        for drone_id, websocket in self.drone_connections.items():
            try:
                await websocket.send(json.dumps(message))
            except websockets.exceptions.ConnectionClosed:
                disconnected.append(drone_id)
            except Exception as e:
                self.logger.error(f"Error sending to drone {drone_id}: {e}")
                disconnected.append(drone_id)
        
        # Remove disconnected drones
        for drone_id in disconnected:
            del self.drone_connections[drone_id]
    
    async def unregister_connection(self, connection_id):
        """Remove connection when it closes"""
        if connection_id in self.connections:
            del self.connections[connection_id]
            self.logger.info(f"Connection {connection_id} disconnected")

# Initialize WebSocket manager
websocket_manager = WebSocketManager() 