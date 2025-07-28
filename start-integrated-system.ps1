#!/usr/bin/env pwsh

Write-Host "🚀 Starting Advanced Drone Surveillance System..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check service health
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$MaxRetries = 30,
        [int]$DelaySeconds = 2
    )
    
    Write-Host "🔍 Checking health of $ServiceName..." -ForegroundColor Yellow
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5
            if ($response) {
                Write-Host "✅ $ServiceName is healthy!" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Write-Host "⏳ Waiting for $ServiceName... (Attempt $i/$MaxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
        }
    }
    
    Write-Host "❌ $ServiceName failed to start properly" -ForegroundColor Red
    return $false
}

# Check if Docker is running
if (-not (Test-DockerRunning)) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Build and start all services
Write-Host "🔨 Building and starting all services..." -ForegroundColor Cyan
docker-compose up --build -d

# Wait for services to start
Write-Host "⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Health check endpoints
$healthChecks = @{
    "MongoDB" = "http://localhost:27017"
    "Redis" = "http://localhost:6379"
    "Backend" = "http://localhost:5000/api/health"
    "AI Inference" = "http://localhost:5800/health"
    "Flight Controller" = "http://localhost:5100/health"
    "Mission Planner" = "http://localhost:5200/health"
    "Sensor Fusion" = "http://localhost:5300/health"
    "Swarm Comm Broker" = "http://localhost:5400/health"
    "Security Layer" = "http://localhost:5450/health"
    "Latency Predictor" = "http://localhost:5500/health"
    "Video Encryption" = "http://localhost:5600/health"
    "Swarm AI" = "http://localhost:5700/health"
    "Frontend" = "http://localhost:3000"
}

# Check service health
$failedServices = @()
foreach ($service in $healthChecks.GetEnumerator()) {
    if ($service.Key -eq "MongoDB" -or $service.Key -eq "Redis") {
        # Skip direct health checks for MongoDB and Redis
        continue
    }
    
    if (-not (Test-ServiceHealth -ServiceName $service.Key -Url $service.Value)) {
        $failedServices += $service.Key
    }
}

# Display results
Write-Host "`n🎯 Service Status Summary:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# Check Docker containers
$containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host $containers

Write-Host "`n📊 Service Health Status:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

if ($failedServices.Count -eq 0) {
    Write-Host "✅ All services are running successfully!" -ForegroundColor Green
    
    Write-Host "`n🌐 Access URLs:" -ForegroundColor Cyan
    Write-Host "===============" -ForegroundColor Cyan
    Write-Host "Frontend Dashboard: http://localhost:3000" -ForegroundColor White
    Write-Host "Backend API: http://localhost:5000" -ForegroundColor White
    Write-Host "AI Inference Service: http://localhost:5800" -ForegroundColor White
    Write-Host "WebSocket Connection: ws://localhost:8080" -ForegroundColor White
    
    Write-Host "`n📋 API Endpoints:" -ForegroundColor Cyan
    Write-Host "=================" -ForegroundColor Cyan
    Write-Host "Health Check: GET http://localhost:5000/api/health" -ForegroundColor White
    Write-Host "Drones List: GET http://localhost:5000/api/drones" -ForegroundColor White
    Write-Host "AI Detection: POST http://localhost:5000/api/ai/detect" -ForegroundColor White
    Write-Host "Service Status: GET http://localhost:5000/api/services/status" -ForegroundColor White
    
    Write-Host "`n🎮 Next Steps:" -ForegroundColor Cyan
    Write-Host "==============" -ForegroundColor Cyan
    Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
    Write-Host "2. Test AI detection by uploading an image" -ForegroundColor White
    Write-Host "3. Monitor real-time drone telemetry" -ForegroundColor White
    Write-Host "4. Check service status at http://localhost:5000/api/services/status" -ForegroundColor White
    
} else {
    Write-Host "⚠️ Some services failed to start:" -ForegroundColor Yellow
    foreach ($service in $failedServices) {
        Write-Host "   - $service" -ForegroundColor Red
    }
    
    Write-Host "`n🔧 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    Write-Host "1. Check Docker logs: docker-compose logs [service-name]" -ForegroundColor White
    Write-Host "2. Restart failed services: docker-compose restart [service-name]" -ForegroundColor White
    Write-Host "3. Check port conflicts: netstat -an | findstr :5000" -ForegroundColor White
}

Write-Host "`n🛠️ Management Commands:" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "Stop all services: docker-compose down" -ForegroundColor White
Write-Host "View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "Restart service: docker-compose restart [service-name]" -ForegroundColor White
Write-Host "Check status: docker-compose ps" -ForegroundColor White

Write-Host "`n🚀 Advanced Drone Surveillance System is ready!" -ForegroundColor Green
