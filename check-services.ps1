# PowerShell script to check if all services are running correctly

Write-Host "Checking Advanced Drone Surveillance System Services..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Function to check if a port is in use
function Test-PortInUse {
    param (
        [int]$Port
    )
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $result = $connection.BeginConnect("localhost", $Port, $null, $null)
        $wait = $result.AsyncWaitHandle.WaitOne(100, $false)
        
        if ($wait) {
            $connection.EndConnect($result)
            $connection.Close()
            return $true
        } else {
            $connection.Close()
            return $false
        }
    } catch {
        return $false
    }
}

# Function to check HTTP endpoint
function Test-HttpEndpoint {
    param (
        [string]$Url
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            return $true
        } else {
            return $false
        }
    } catch {
        return $false
    }
}

# Check MongoDB
$mongoPort = 27017
if (Test-PortInUse -Port $mongoPort) {
    Write-Host "✅ MongoDB is running on port $mongoPort" -ForegroundColor Green
} else {
    Write-Host "❌ MongoDB is NOT running on port $mongoPort" -ForegroundColor Red
}

# Check Backend Express server
$backendPort = 5000
if (Test-PortInUse -Port $backendPort) {
    Write-Host "✅ Backend Express server is running on port $backendPort" -ForegroundColor Green
    
    # Check API endpoint
    if (Test-HttpEndpoint -Url "http://localhost:$backendPort") {
        Write-Host "  ✅ Backend API is responding" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Backend API is NOT responding" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Backend Express server is NOT running on port $backendPort" -ForegroundColor Red
}

# Check WebSocket server
$wsPort = 8080
if (Test-PortInUse -Port $wsPort) {
    Write-Host "✅ WebSocket server is running on port $wsPort" -ForegroundColor Green
} else {
    Write-Host "❌ WebSocket server is NOT running on port $wsPort" -ForegroundColor Red
}

# Check Frontend
$frontendPort = 3000
if (Test-PortInUse -Port $frontendPort) {
    Write-Host "✅ Frontend is running on port $frontendPort" -ForegroundColor Green
    
    # Check frontend is responding
    if (Test-HttpEndpoint -Url "http://localhost:$frontendPort") {
        Write-Host "  ✅ Frontend is responding" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Frontend is NOT responding" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Frontend is NOT running on port $frontendPort" -ForegroundColor Red
}

# Check Microservices
$microservices = @{
    "Flight Controller Bridge" = 5100
    "Mission Planner" = 5200
    "Sensor Fusion" = 5300
    "Swarm Communication Broker" = 5400
    "Security Layer" = 5450
    "Latency Predictor" = 5500
    "Video Encryption" = 5600
    "Swarm AI" = 5700
}

Write-Host "
Checking Microservices:" -ForegroundColor Cyan
foreach ($service in $microservices.GetEnumerator()) {
    if (Test-PortInUse -Port $service.Value) {
        Write-Host "✅ $($service.Key) is running on port $($service.Value)" -ForegroundColor Green
    } else {
        Write-Host "❌ $($service.Key) is NOT running on port $($service.Value)" -ForegroundColor Red
    }
}

Write-Host "
Service Check Complete!" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "If any services are not running, please check the Docker logs or start the services manually." -ForegroundColor Yellow
Write-Host "For more information, refer to the PORT_CONFIGURATION.md file." -ForegroundColor Yellow