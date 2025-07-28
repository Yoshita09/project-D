# Docker Setup and Verification Script

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This script should be run as Administrator for best results." -ForegroundColor Yellow
    Write-Host "Some operations may fail without admin privileges." -ForegroundColor Yellow
    Write-Host ""
}

# Check if Docker is installed
Write-Host "Checking for Docker installation..." -ForegroundColor Cyan
$dockerInstalled = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)

if (-not $dockerInstalled) {
    Write-Host "Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    
    # Check if Docker Desktop is installed but not in PATH
    $dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    $dockerDesktopInstalled = Test-Path $dockerDesktopPath
    
    if ($dockerDesktopInstalled) {
        Write-Host "Docker Desktop is installed but not properly configured in PATH." -ForegroundColor Yellow
        Write-Host "Try starting Docker Desktop and then restart your terminal." -ForegroundColor Yellow
        
        $startDocker = Read-Host "Would you like to start Docker Desktop now? (Y/N)"
        if ($startDocker -eq "Y" -or $startDocker -eq "y") {
            Start-Process $dockerDesktopPath
            Write-Host "Docker Desktop is starting. Please wait for it to initialize completely." -ForegroundColor Green
            Write-Host "After Docker is running, restart your terminal and try your command again." -ForegroundColor Green
        }
    } else {
        Write-Host "Docker Desktop is not installed." -ForegroundColor Red
        Write-Host "Options for installing Docker:" -ForegroundColor Cyan
        Write-Host "1. Install Docker Desktop (recommended for Windows)" -ForegroundColor White
        Write-Host "2. Install Docker Engine with WSL 2 backend" -ForegroundColor White
        Write-Host "3. Exit" -ForegroundColor White
        
        $choice = Read-Host "Enter your choice (1-3)"
        
        switch ($choice) {
            "1" {
                Write-Host "Opening Docker Desktop download page..." -ForegroundColor Green
                Start-Process "https://www.docker.com/products/docker-desktop/"
                Write-Host "After installation:" -ForegroundColor Yellow
                Write-Host "1. Restart your computer" -ForegroundColor Yellow
                Write-Host "2. Open Docker Desktop" -ForegroundColor Yellow
                Write-Host "3. Wait for Docker to start completely" -ForegroundColor Yellow
                Write-Host "4. Try running 'docker compose up --build' again" -ForegroundColor Yellow
            }
            "2" {
                Write-Host "For Docker Engine with WSL 2:" -ForegroundColor Yellow
                Write-Host "1. Install WSL 2: https://docs.microsoft.com/en-us/windows/wsl/install" -ForegroundColor Yellow
                Write-Host "2. Follow Docker Engine installation: https://docs.docker.com/engine/install/" -ForegroundColor Yellow
                
                $openWsl = Read-Host "Would you like to open the WSL installation guide? (Y/N)"
                if ($openWsl -eq "Y" -or $openWsl -eq "y") {
                    Start-Process "https://docs.microsoft.com/en-us/windows/wsl/install"
                }
            }
            "3" {
                Write-Host "Exiting..." -ForegroundColor Red
            }
            default {
                Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "Docker is installed and in PATH." -ForegroundColor Green
    
    # Check if Docker is running
    try {
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker is running properly." -ForegroundColor Green
            
            # Display Docker version
            Write-Host "
Docker version information:" -ForegroundColor Cyan
            docker version
            
            Write-Host "
You can now run 'docker compose up --build' in your project directory." -ForegroundColor Green
        } else {
            Write-Host "Docker is installed but not running or has connection issues." -ForegroundColor Yellow
            Write-Host "Error: $dockerInfo" -ForegroundColor Red
            Write-Host "Make sure Docker Desktop is running and properly initialized." -ForegroundColor Yellow
            
            # Check if Docker Desktop is installed
            $dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
            if (Test-Path $dockerDesktopPath) {
                $startDocker = Read-Host "Would you like to start Docker Desktop now? (Y/N)"
                if ($startDocker -eq "Y" -or $startDocker -eq "y") {
                    Start-Process $dockerDesktopPath
                    Write-Host "Docker Desktop is starting. Please wait for it to initialize completely." -ForegroundColor Green
                }
            }
        }
    } catch {
        Write-Host "Error checking Docker status: $_" -ForegroundColor Red
    }
}

Write-Host "
Press Enter to exit..."
Read-Host