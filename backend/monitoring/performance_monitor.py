"""
Advanced Performance Monitoring System for Drone Surveillance
Provides real-time metrics, alerting, and performance analytics
"""

import time
import psutil
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import json
import aiohttp
from collections import defaultdict, deque
import threading
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SystemMetrics:
    """System performance metrics"""
    timestamp: str
    cpu_percent: float
    memory_percent: float
    memory_used_gb: float
    disk_usage_percent: float
    network_bytes_sent: int
    network_bytes_recv: int
    active_connections: int
    system_load: float

@dataclass
class ServiceMetrics:
    """Service-specific performance metrics"""
    service_name: str
    timestamp: str
    response_time_ms: float
    request_count: int
    error_count: int
    success_rate: float
    active_requests: int
    queue_size: int

@dataclass
class AIMetrics:
    """AI model performance metrics"""
    timestamp: str
    model_name: str
    inference_time_ms: float
    batch_size: int
    accuracy: float
    confidence_threshold: float
    detections_per_second: float
    memory_usage_mb: float
    gpu_utilization: Optional[float] = None

@dataclass
class Alert:
    """System alert"""
    timestamp: str
    level: str  # INFO, WARNING, ERROR, CRITICAL
    service: str
    message: str
    metric_value: float
    threshold: float
    resolved: bool = False

class PerformanceMonitor:
    """Comprehensive performance monitoring system"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.metrics_history = {
            'system': deque(maxlen=1000),
            'services': defaultdict(lambda: deque(maxlen=500)),
            'ai': deque(maxlen=500),
            'alerts': deque(maxlen=200)
        }
        
        # Alert thresholds
        self.thresholds = {
            'cpu_percent': 80.0,
            'memory_percent': 85.0,
            'disk_usage_percent': 90.0,
            'response_time_ms': 5000.0,
            'error_rate': 0.05,  # 5%
            'ai_inference_time_ms': 2000.0,
            'success_rate': 0.95  # 95%
        }
        
        # Service endpoints to monitor
        self.services = {
            'backend': 'http://localhost:5000/health',
            'ai_inference': 'http://localhost:5800/health',
            'flight_controller': 'http://localhost:5100/health',
            'mission_planner': 'http://localhost:5200/health',
            'sensor_fusion': 'http://localhost:5300/health',
            'swarm_comm': 'http://localhost:5400/health',
            'security_layer': 'http://localhost:5450/health',
            'latency_predictor': 'http://localhost:5500/health',
            'video_encryption': 'http://localhost:5600/health',
            'swarm_ai': 'http://localhost:5700/health'
        }
        
        self.monitoring_active = False
        self.monitoring_thread = None
        
        # Performance counters
        self.counters = defaultdict(int)
        self.timers = defaultdict(list)
        
    async def start_monitoring(self):
        """Start the performance monitoring system"""
        if self.monitoring_active:
            logger.warning("Monitoring already active")
            return
        
        self.monitoring_active = True
        logger.info("Starting performance monitoring system...")
        
        # Start monitoring in background thread
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
        
        logger.info("Performance monitoring started successfully")
    
    def stop_monitoring(self):
        """Stop the performance monitoring system"""
        self.monitoring_active = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
        logger.info("Performance monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.monitoring_active:
            try:
                # Run monitoring tasks
                asyncio.run(self._collect_metrics())
                time.sleep(self.config.get('monitoring_interval', 30))  # Default 30s
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                time.sleep(5)
    
    async def _collect_metrics(self):
        """Collect all system metrics"""
        try:
            # Collect system metrics
            system_metrics = await self._get_system_metrics()
            self.metrics_history['system'].append(system_metrics)
            
            # Collect service metrics
            service_metrics = await self._get_service_metrics()
            for service_name, metrics in service_metrics.items():
                self.metrics_history['services'][service_name].append(metrics)
            
            # Check for alerts
            await self._check_alerts()
            
            # Log summary
            self._log_metrics_summary(system_metrics, service_metrics)
            
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
    
    async def _get_system_metrics(self) -> SystemMetrics:
        """Collect system-level performance metrics"""
        try:
            # CPU and memory
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used_gb = memory.used / (1024**3)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_usage_percent = disk.percent
            
            # Network
            network = psutil.net_io_counters()
            network_bytes_sent = network.bytes_sent
            network_bytes_recv = network.bytes_recv
            
            # System load (Unix-like systems)
            try:
                system_load = psutil.getloadavg()[0]  # 1-minute load average
            except AttributeError:
                system_load = 0.0  # Windows doesn't have load average
            
            # Active connections (approximate)
            try:
                active_connections = len(psutil.net_connections())
            except:
                active_connections = 0
            
            return SystemMetrics(
                timestamp=datetime.utcnow().isoformat(),
                cpu_percent=cpu_percent,
                memory_percent=memory_percent,
                memory_used_gb=memory_used_gb,
                disk_usage_percent=disk_usage_percent,
                network_bytes_sent=network_bytes_sent,
                network_bytes_recv=network_bytes_recv,
                active_connections=active_connections,
                system_load=system_load
            )
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return SystemMetrics(
                timestamp=datetime.utcnow().isoformat(),
                cpu_percent=0.0,
                memory_percent=0.0,
                memory_used_gb=0.0,
                disk_usage_percent=0.0,
                network_bytes_sent=0,
                network_bytes_recv=0,
                active_connections=0,
                system_load=0.0
            )
    
    async def _get_service_metrics(self) -> Dict[str, ServiceMetrics]:
        """Collect service-specific performance metrics"""
        service_metrics = {}
        
        async with aiohttp.ClientSession() as session:
            for service_name, url in self.services.items():
                try:
                    start_time = time.time()
                    
                    async with session.get(url, timeout=10) as response:
                        end_time = time.time()
                        response_time_ms = (end_time - start_time) * 1000
                        
                        # Parse response
                        if response.status == 200:
                            data = await response.json()
                            success_rate = 1.0
                            error_count = 0
                        else:
                            success_rate = 0.0
                            error_count = 1
                        
                        # Get queue size (if available)
                        queue_size = data.get('queue_size', 0) if response.status == 200 else 0
                        active_requests = data.get('active_requests', 0) if response.status == 200 else 0
                        
                        service_metrics[service_name] = ServiceMetrics(
                            service_name=service_name,
                            timestamp=datetime.utcnow().isoformat(),
                            response_time_ms=response_time_ms,
                            request_count=1,
                            error_count=error_count,
                            success_rate=success_rate,
                            active_requests=active_requests,
                            queue_size=queue_size
                        )
                        
                except Exception as e:
                    logger.warning(f"Failed to get metrics for {service_name}: {e}")
                    service_metrics[service_name] = ServiceMetrics(
                        service_name=service_name,
                        timestamp=datetime.utcnow().isoformat(),
                        response_time_ms=0.0,
                        request_count=0,
                        error_count=1,
                        success_rate=0.0,
                        active_requests=0,
                        queue_size=0
                    )
        
        return service_metrics
    
    async def _check_alerts(self):
        """Check for performance alerts"""
        try:
            # Get latest metrics
            if not self.metrics_history['system']:
                return
            
            latest_system = self.metrics_history['system'][-1]
            
            # Check system alerts
            if latest_system.cpu_percent > self.thresholds['cpu_percent']:
                await self._create_alert('SYSTEM', 'CRITICAL', 
                    f"High CPU usage: {latest_system.cpu_percent:.1f}%", 
                    latest_system.cpu_percent, self.thresholds['cpu_percent'])
            
            if latest_system.memory_percent > self.thresholds['memory_percent']:
                await self._create_alert('SYSTEM', 'WARNING', 
                    f"High memory usage: {latest_system.memory_percent:.1f}%", 
                    latest_system.memory_percent, self.thresholds['memory_percent'])
            
            if latest_system.disk_usage_percent > self.thresholds['disk_usage_percent']:
                await self._create_alert('SYSTEM', 'CRITICAL', 
                    f"High disk usage: {latest_system.disk_usage_percent:.1f}%", 
                    latest_system.disk_usage_percent, self.thresholds['disk_usage_percent'])
            
            # Check service alerts
            for service_name, metrics_queue in self.metrics_history['services'].items():
                if not metrics_queue:
                    continue
                
                latest_service = metrics_queue[-1]
                
                if latest_service.response_time_ms > self.thresholds['response_time_ms']:
                    await self._create_alert(service_name, 'WARNING', 
                        f"Slow response time: {latest_service.response_time_ms:.1f}ms", 
                        latest_service.response_time_ms, self.thresholds['response_time_ms'])
                
                if latest_service.success_rate < self.thresholds['success_rate']:
                    await self._create_alert(service_name, 'ERROR', 
                        f"Low success rate: {latest_service.success_rate:.1%}", 
                        latest_service.success_rate, self.thresholds['success_rate'])
                
                if latest_service.error_count > 0:
                    await self._create_alert(service_name, 'WARNING', 
                        f"Service errors detected: {latest_service.error_count}", 
                        latest_service.error_count, 0)
            
        except Exception as e:
            logger.error(f"Error checking alerts: {e}")
    
    async def _create_alert(self, service: str, level: str, message: str, 
                           metric_value: float, threshold: float):
        """Create a new alert"""
        alert = Alert(
            timestamp=datetime.utcnow().isoformat(),
            level=level,
            service=service,
            message=message,
            metric_value=metric_value,
            threshold=threshold
        )
        
        self.metrics_history['alerts'].append(alert)
        
        # Log alert
        logger.warning(f"ALERT [{level}] {service}: {message}")
        
        # Send notification (implement as needed)
        await self._send_notification(alert)
    
    async def _send_notification(self, alert: Alert):
        """Send alert notification (implement based on requirements)"""
        # This could send to Slack, email, SMS, etc.
        notification = {
            "type": "alert",
            "timestamp": alert.timestamp,
            "level": alert.level,
            "service": alert.service,
            "message": alert.message,
            "metric_value": alert.metric_value,
            "threshold": alert.threshold
        }
        
        # For now, just log the notification
        logger.info(f"Notification sent: {notification}")
    
    def _log_metrics_summary(self, system_metrics: SystemMetrics, 
                            service_metrics: Dict[str, ServiceMetrics]):
        """Log a summary of current metrics"""
        try:
            # Calculate averages
            avg_response_time = sum(m.response_time_ms for m in service_metrics.values()) / len(service_metrics)
            avg_success_rate = sum(m.success_rate for m in service_metrics.values()) / len(service_metrics)
            total_errors = sum(m.error_count for m in service_metrics.values())
            
            logger.info(f"Metrics Summary - CPU: {system_metrics.cpu_percent:.1f}%, "
                       f"Memory: {system_metrics.memory_percent:.1f}%, "
                       f"Avg Response: {avg_response_time:.1f}ms, "
                       f"Success Rate: {avg_success_rate:.1%}, "
                       f"Errors: {total_errors}")
            
        except Exception as e:
            logger.error(f"Error logging metrics summary: {e}")
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get a summary of current metrics"""
        try:
            if not self.metrics_history['system']:
                return {"error": "No metrics available"}
            
            latest_system = self.metrics_history['system'][-1]
            
            # Calculate service averages
            service_summaries = {}
            for service_name, metrics_queue in self.metrics_history['services'].items():
                if metrics_queue:
                    latest = metrics_queue[-1]
                    service_summaries[service_name] = {
                        "response_time_ms": latest.response_time_ms,
                        "success_rate": latest.success_rate,
                        "error_count": latest.error_count,
                        "active_requests": latest.active_requests,
                        "queue_size": latest.queue_size
                    }
            
            # Get recent alerts
            recent_alerts = list(self.metrics_history['alerts'])[-10:]  # Last 10 alerts
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "system": {
                    "cpu_percent": latest_system.cpu_percent,
                    "memory_percent": latest_system.memory_percent,
                    "memory_used_gb": latest_system.memory_used_gb,
                    "disk_usage_percent": latest_system.disk_usage_percent,
                    "active_connections": latest_system.active_connections,
                    "system_load": latest_system.system_load
                },
                "services": service_summaries,
                "alerts": [asdict(alert) for alert in recent_alerts],
                "thresholds": self.thresholds
            }
            
        except Exception as e:
            logger.error(f"Error getting metrics summary: {e}")
            return {"error": str(e)}
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Generate a comprehensive performance report"""
        try:
            if not self.metrics_history['system']:
                return {"error": "No metrics available"}
            
            # Get time range (last hour)
            now = datetime.utcnow()
            one_hour_ago = now - timedelta(hours=1)
            
            # Filter metrics from last hour
            recent_system = [m for m in self.metrics_history['system'] 
                           if datetime.fromisoformat(m.timestamp) > one_hour_ago]
            
            if not recent_system:
                return {"error": "No recent metrics available"}
            
            # Calculate statistics
            cpu_values = [m.cpu_percent for m in recent_system]
            memory_values = [m.memory_percent for m in recent_system]
            response_times = []
            success_rates = []
            
            for service_name, metrics_queue in self.metrics_history['services'].items():
                recent_service = [m for m in metrics_queue 
                                if datetime.fromisoformat(m.timestamp) > one_hour_ago]
                if recent_service:
                    response_times.extend([m.response_time_ms for m in recent_service])
                    success_rates.extend([m.success_rate for m in recent_service])
            
            # Calculate averages and extremes
            avg_cpu = sum(cpu_values) / len(cpu_values) if cpu_values else 0
            max_cpu = max(cpu_values) if cpu_values else 0
            avg_memory = sum(memory_values) / len(memory_values) if memory_values else 0
            max_memory = max(memory_values) if memory_values else 0
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
            max_response_time = max(response_times) if response_times else 0
            avg_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0
            
            return {
                "report_timestamp": now.isoformat(),
                "time_period": "1 hour",
                "metrics_count": len(recent_system),
                "system_performance": {
                    "cpu": {
                        "average": round(avg_cpu, 2),
                        "maximum": round(max_cpu, 2),
                        "current": round(recent_system[-1].cpu_percent, 2)
                    },
                    "memory": {
                        "average": round(avg_memory, 2),
                        "maximum": round(max_memory, 2),
                        "current": round(recent_system[-1].memory_percent, 2)
                    },
                    "disk_usage": round(recent_system[-1].disk_usage_percent, 2)
                },
                "service_performance": {
                    "response_time": {
                        "average": round(avg_response_time, 2),
                        "maximum": round(max_response_time, 2)
                    },
                    "success_rate": round(avg_success_rate, 4)
                },
                "alerts": {
                    "total": len(self.metrics_history['alerts']),
                    "recent": len([a for a in self.metrics_history['alerts'] 
                                 if datetime.fromisoformat(a.timestamp) > one_hour_ago])
                },
                "recommendations": self._generate_recommendations(avg_cpu, avg_memory, avg_response_time, avg_success_rate)
            }
            
        except Exception as e:
            logger.error(f"Error generating performance report: {e}")
            return {"error": str(e)}
    
    def _generate_recommendations(self, avg_cpu: float, avg_memory: float, 
                                avg_response_time: float, avg_success_rate: float) -> List[str]:
        """Generate performance recommendations"""
        recommendations = []
        
        if avg_cpu > 70:
            recommendations.append("Consider scaling up CPU resources or optimizing CPU-intensive operations")
        
        if avg_memory > 80:
            recommendations.append("Memory usage is high - consider increasing RAM or optimizing memory usage")
        
        if avg_response_time > 2000:
            recommendations.append("Response times are slow - investigate service bottlenecks")
        
        if avg_success_rate < 0.95:
            recommendations.append("Success rate is below target - investigate service errors")
        
        if not recommendations:
            recommendations.append("System performance is within acceptable parameters")
        
        return recommendations
    
    def save_metrics_to_file(self, filename: str = None):
        """Save current metrics to a JSON file"""
        try:
            if filename is None:
                filename = f"performance_metrics_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
            
            # Convert metrics to serializable format
            export_data = {
                "export_timestamp": datetime.utcnow().isoformat(),
                "system_metrics": [asdict(m) for m in self.metrics_history['system']],
                "service_metrics": {
                    service: [asdict(m) for m in metrics]
                    for service, metrics in self.metrics_history['services'].items()
                },
                "ai_metrics": [asdict(m) for m in self.metrics_history['ai']],
                "alerts": [asdict(a) for a in self.metrics_history['alerts']],
                "thresholds": self.thresholds
            }
            
            with open(filename, 'w') as f:
                json.dump(export_data, f, indent=2)
            
            logger.info(f"Metrics saved to {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"Error saving metrics: {e}")
            return None

# Global monitor instance
performance_monitor = PerformanceMonitor()

async def start_performance_monitoring():
    """Start the global performance monitoring system"""
    await performance_monitor.start_monitoring()

def stop_performance_monitoring():
    """Stop the global performance monitoring system"""
    performance_monitor.stop_monitoring()

def get_performance_summary():
    """Get current performance summary"""
    return performance_monitor.get_metrics_summary()

def get_performance_report():
    """Get comprehensive performance report"""
    return performance_monitor.get_performance_report()

if __name__ == "__main__":
    # Test the monitoring system
    async def test_monitoring():
        await start_performance_monitoring()
        
        # Let it run for a few minutes
        await asyncio.sleep(180)
        
        # Get summary
        summary = get_performance_summary()
        print("Performance Summary:", json.dumps(summary, indent=2))
        
        # Get report
        report = get_performance_report()
        print("Performance Report:", json.dumps(report, indent=2))
        
        # Save metrics
        filename = performance_monitor.save_metrics_to_file()
        print(f"Metrics saved to: {filename}")
        
        stop_performance_monitoring()
    
    asyncio.run(test_monitoring()) 