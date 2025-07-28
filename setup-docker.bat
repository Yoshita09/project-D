@echo off
echo Checking for Docker installation...

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not installed or not in PATH.
    echo.
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    echo.
    echo After installation:
    echo 1. Restart your computer
    echo 2. Open Docker Desktop
    echo 3. Wait for Docker to start completely
    echo 4. Try running 'docker compose up --build' again
    echo.
    echo Would you like to open the Docker Desktop download page? (Y/N)
    set /p choice=Your choice: 
    if /i "%choice%"=="Y" start https://www.docker.com/products/docker-desktop/
) else (
    echo Docker is installed and in PATH.
    echo.
    echo If you're still having issues, make sure Docker Desktop is running.
    echo Try opening Docker Desktop and waiting for it to start completely.
)

echo.
echo Press any key to exit...
pause >nul