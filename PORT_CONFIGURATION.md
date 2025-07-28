# Port Configuration Guide for Advanced Drone Surveillance System

## Overview

This document explains how the ports are configured and aligned across the different services in the Advanced Drone Surveillance System. The system uses Docker Compose to orchestrate all services and ensure they can communicate with each other properly.

## Port Assignments

### Main Services

- **Frontend (React/Vite)**: Port 3000
- **Backend (Express)**: Port 5000
- **WebSocket Server**: Port 8080
- **MongoDB**: Port 27017

### Microservices

- **Flight Controller Bridge**: Port 5100
- **Mission Planner**: Port 5200
- **Sensor Fusion**: Port 5300
- **Swarm Communication Broker**: Ports 5400, 5401
- **Security Layer**: Port 5450
- **Latency Predictor**: Port 5500
- **Video Encryption**: Port 5600
- **Swarm AI**: Port 5700

## How Services Communicate

### Frontend to Backend Communication

The frontend communicates with the backend through:

1. **REST API calls**: The frontend makes HTTP requests to the backend API at `http://localhost:5000/api/*`
2. **WebSocket connection**: Real-time updates are received via WebSocket at `ws://localhost:8080`

The frontend is configured to use environment variables for these URLs:

```
VITE_API_BASE_URL=http://localhost:5000
VITE_WEBSOCKET_URL=ws://localhost:8080
```

Additionally, the Vite development server is configured with proxies to avoid CORS issues:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    },
    '/ws': {
      target: 'ws://localhost:8080',
      ws: true
    }
  }
}
```

### Backend to Microservices Communication

The backend communicates with microservices using their respective URLs, which are configured through environment variables:

```
FLIGHT_CONTROLLER_URL=http://flight_controller_bridge:5100
MISSION_PLANNER_URL=http://mission_planner:5200
SENSOR_FUSION_URL=http://sensor_fusion:5300
SWARM_COMM_BROKER_URL=http://swarm_comm_broker:5400
SECURITY_LAYER_URL=http://security_layer:5450
LATENCY_PREDICTOR_URL=http://latency_predictor:5500
VIDEO_ENCRYPTION_URL=http://video_encryption:5600
SWARM_AI_URL=http://swarm_ai:5700
```

In the Docker Compose environment, these services can communicate with each other using their service names as hostnames.

### Backend to Database Communication

The backend connects to MongoDB using the connection string:

```
MONGODB_URI=mongodb://mongodb:27017/drone_fleet
```

Where `mongodb` is the service name in the Docker Compose configuration.

## Running the System

To run the entire system with properly aligned ports:

1. Make sure Docker and Docker Compose are installed
2. Navigate to the project root directory
3. Run `docker-compose up --build`
4. Access the frontend at http://localhost:3000

## Troubleshooting

### Connection Issues

If you experience connection issues between services:

1. Check that all services are running with `docker-compose ps`
2. Verify that the environment variables are correctly set in the Docker Compose file
3. Check the logs for each service with `docker-compose logs [service_name]`
4. Ensure that the frontend is using the correct API and WebSocket URLs

### Port Conflicts

If you have port conflicts with other applications:

1. You can modify the external ports in the `docker-compose.yml` file
2. Update the corresponding environment variables in the `.env` files
3. Restart the services with `docker-compose down` and `docker-compose up --build`

## Local Development

For local development without Docker:

1. Start MongoDB locally on port 27017
2. Start the backend with `npm run dev` in the `backend` directory
3. Start the frontend with `npm run dev` in the `drone-surveillance` directory
4. Start each microservice individually according to their documentation

Make sure to set the appropriate environment variables or update the configuration files to use `localhost` instead of the Docker service names.