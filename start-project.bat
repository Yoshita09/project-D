@echo off
echo Advanced Drone Surveillance System Startup
echo ========================================
echo.

:: Check if Docker is installed and running
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not installed or not in PATH.
    echo Running setup script...
    echo.
    PowerShell -ExecutionPolicy Bypass -File .\setup-docker.ps1
    echo.
    echo Please restart this script after installing Docker.
    echo.
    pause
    exit
)

:: Check if Docker is running
docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker is installed but not running.
    echo Please start Docker Desktop and wait for it to initialize completely.
    echo.
    echo Press any key when Docker is running...
    pause >nul
)

echo Starting the Advanced Drone Surveillance System...
echo.

:: Run docker-compose
echo Running docker-compose up --build
echo This may take several minutes for the first build.
echo.
docker-compose up --build

:: If docker-compose fails, show error
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error running docker-compose. Please check the error messages above.
    echo.
    pause
)