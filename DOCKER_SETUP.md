# Docker Setup for Advanced Drone Surveillance System

## Prerequisites

- Windows 10 64-bit: Pro, Enterprise, or Education (Build 16299 or later)
- Windows 10 Home (Build 19041 or later)
- Windows 11 64-bit: Home or Pro version 21H2 or higher
- Enabled Hyper-V and Containers Windows features

## Installation Steps

### 1. Install Docker Desktop

1. Download Docker Desktop from the [official website](https://www.docker.com/products/docker-desktop/)
2. Run the installer and follow the instructions
3. Restart your computer after installation
4. Start Docker Desktop and wait for it to initialize completely

### 2. Verify Docker Installation

Run the following commands in PowerShell or Command Prompt to verify Docker is installed correctly:

```powershell
docker --version
docker-compose --version
```

### 3. Setup Scripts

This project includes two setup scripts to help you install and configure Docker:

- **setup-docker.bat**: Simple batch script to check Docker installation and open the download page if needed
- **setup-docker.ps1**: More advanced PowerShell script with additional options and troubleshooting

To run the PowerShell script:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\setup-docker.ps1
```

## Running the Project

Once Docker is installed and running, you can start the project using:

```powershell
# Navigate to the project root directory
cd "C:\Users\Ashutosh Mishra\OneDrive\Desktop\Project D"

# Build and start all services
docker-compose up --build
```

This will start all the services defined in the `docker-compose.yml` file, including:

- Backend API server
- Frontend React application
- All microservices (flight controller bridge, mission planner, etc.)

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Individual microservices are available on their respective ports as defined in the docker-compose.yml file

## Troubleshooting

### Common Issues

1. **Docker command not found**
   - Make sure Docker Desktop is installed and running
   - Restart your terminal/PowerShell after installing Docker
   - Add Docker to your PATH if it's not already there

2. **Docker Desktop not starting**
   - Check if Hyper-V is enabled
   - Verify virtualization is enabled in BIOS
   - Run the Docker Desktop troubleshooter

3. **Build errors**
   - Make sure all required files are present in the project
   - Check Dockerfile syntax
   - Verify all dependencies are correctly specified

### Getting Help

If you encounter issues not covered here, refer to the [Docker documentation](https://docs.docker.com/) or run the included setup-docker.ps1 script for automated diagnostics and solutions.