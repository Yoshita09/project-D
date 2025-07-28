@echo off
echo Starting Advanced Drone Surveillance System...
echo =============================================

:: Check if Docker is installed and running
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed or not in PATH. Please install Docker Desktop.
    echo Visit: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

:: Check if Docker is running
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo Docker is running. Starting services...

:: Build and start all services
echo Building and starting all services with Docker Compose...
docker-compose up --build -d

if %errorlevel% neq 0 (
    echo Failed to start services with Docker Compose.
    pause
    exit /b 1
)

echo.
echo All services started successfully!
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo To check the status of all services, run: .\check-services.ps1
echo To stop all services, run: docker-compose down
echo.
echo For more information, refer to the PORT_CONFIGURATION.md file.
echo.

pause