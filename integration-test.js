const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5000';
const AI_URL = 'http://localhost:5800';
const WS_URL = 'ws://localhost:8080';

// Test results
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to log test results
function logTest(testName, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName} ${message}`);

    testResults.tests.push({
        name: testName,
        passed,
        message
    });

    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
}

// Test service health
async function testServiceHealth() {
    console.log('\n🔍 Testing Service Health...');

    const services = [
        { name: 'Backend', url: `${BASE_URL}/api/health` },
        { name: 'AI Inference', url: `${AI_URL}/health` },
        { name: 'Flight Controller', url: 'http://localhost:5100/health' },
        { name: 'Mission Planner', url: 'http://localhost:5200/health' },
        { name: 'Sensor Fusion', url: 'http://localhost:5300/health' },
        { name: 'Swarm Comm Broker', url: 'http://localhost:5400/health' },
        { name: 'Security Layer', url: 'http://localhost:5450/health' },
        { name: 'Latency Predictor', url: 'http://localhost:5500/health' },
        { name: 'Video Encryption', url: 'http://localhost:5600/health' },
        { name: 'Swarm AI', url: 'http://localhost:5700/health' }
    ];

    for (const service of services) {
        try {
            const response = await axios.get(service.url, { timeout: 5000 });
            logTest(`${service.name} Health Check`, response.status === 200, `Status: ${response.status}`);
        } catch (error) {
            logTest(`${service.name} Health Check`, false, `Error: ${error.message}`);
        }
    }
}

// Test database connectivity
async function testDatabaseConnectivity() {
    console.log('\n🗄️ Testing Database Connectivity...');

    try {
        const response = await axios.get(`${BASE_URL}/api/drones`);
        logTest('Database Connection', response.status === 200, 'MongoDB accessible');
    } catch (error) {
        logTest('Database Connection', false, `Error: ${error.message}`);
    }
}

// Test AI inference service
async function testAIInference() {
    console.log('\n🤖 Testing AI Inference Service...');

    try {
        // Test model info endpoint
        const modelInfo = await axios.get(`${AI_URL}/model/info`);
        logTest('AI Model Info', modelInfo.status === 200, `Model: ${modelInfo.data.model_type}`);

        // Create a simple test image (base64 encoded 1x1 pixel)
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==';

        // Test detection endpoint
        const detectionResponse = await axios.post(`${AI_URL}/detect`, {
            image: testImageBase64
        });

        logTest('AI Detection', detectionResponse.status === 200, `Detections: ${detectionResponse.data.count || 0}`);

    } catch (error) {
        logTest('AI Inference', false, `Error: ${error.message}`);
    }
}

// Test WebSocket connectivity
async function testWebSocketConnectivity() {
    console.log('\n🔌 Testing WebSocket Connectivity...');

    return new Promise((resolve) => {
        try {
            const ws = new WebSocket(WS_URL);
            let connected = false;

            ws.on('open', () => {
                connected = true;
                logTest('WebSocket Connection', true, 'Connected successfully');

                // Test service registration
                ws.send(JSON.stringify({
                    type: 'service_registration',
                    service: 'test_client',
                    port: 9999
                }));
            });

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'registration_confirmed') {
                        logTest('WebSocket Service Registration', true, 'Registration confirmed');
                    }
                } catch (error) {
                    logTest('WebSocket Message Parsing', false, error.message);
                }
            });

            ws.on('error', (error) => {
                logTest('WebSocket Connection', false, `Error: ${error.message}`);
                resolve();
            });

            // Close connection after 3 seconds
            setTimeout(() => {
                if (connected) {
                    ws.close();
                    logTest('WebSocket Cleanup', true, 'Connection closed properly');
                } else {
                    logTest('WebSocket Connection', false, 'Failed to connect within timeout');
                }
                resolve();
            }, 3000);

        } catch (error) {
            logTest('WebSocket Setup', false, `Error: ${error.message}`);
            resolve();
        }
    });
}

// Test inter-service communication
async function testInterServiceCommunication() {
    console.log('\n🔄 Testing Inter-Service Communication...');

    try {
        // Test service status endpoint
        const serviceStatus = await axios.get(`${BASE_URL}/api/services/status`);
        logTest('Service Status Check', serviceStatus.status === 200, 'All services status retrieved');

        // Test AI integration through backend
        const aiHealth = await axios.get(`${BASE_URL}/api/ai/health`);
        logTest('Backend-AI Integration', aiHealth.status === 200, 'Backend can communicate with AI service');

        // Test flight controller integration
        const flightStatus = await axios.get('http://localhost:5100/flight/status/test-drone');
        logTest('Flight Controller Integration', flightStatus.status === 200, 'Flight controller accessible');

    } catch (error) {
        logTest('Inter-Service Communication', false, `Error: ${error.message}`);
    }
}

// Test API endpoints
async function testAPIEndpoints() {
    console.log('\n🌐 Testing API Endpoints...');

    const endpoints = [
        { method: 'GET', url: `${BASE_URL}/api/drones`, name: 'Get Drones' },
        { method: 'GET', url: `${BASE_URL}/api/analytics/overview`, name: 'Analytics Overview' },
        { method: 'GET', url: `${BASE_URL}/api/analytics/trends`, name: 'Analytics Trends' },
        { method: 'GET', url: `${BASE_URL}/api/defense/systems`, name: 'Defense Systems' },
        { method: 'GET', url: `${BASE_URL}/api/missions`, name: 'Missions' }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios[endpoint.method.toLowerCase()](endpoint.url);
            logTest(`API ${endpoint.name}`, response.status === 200, `Status: ${response.status}`);
        } catch (error) {
            logTest(`API ${endpoint.name}`, false, `Error: ${error.message}`);
        }
    }
}

// Test port configuration
async function testPortConfiguration() {
    console.log('\n🔌 Testing Port Configuration...');

    const ports = [
        { port: 3000, service: 'Frontend' },
        { port: 5000, service: 'Backend' },
        { port: 5100, service: 'Flight Controller' },
        { port: 5200, service: 'Mission Planner' },
        { port: 5300, service: 'Sensor Fusion' },
        { port: 5400, service: 'Swarm Comm Broker' },
        { port: 5450, service: 'Security Layer' },
        { port: 5500, service: 'Latency Predictor' },
        { port: 5600, service: 'Video Encryption' },
        { port: 5700, service: 'Swarm AI' },
        { port: 5800, service: 'AI Inference' },
        { port: 8080, service: 'WebSocket' }
    ];

    for (const { port, service } of ports) {
        try {
            const url = port === 8080 ? `ws://localhost:${port}` : `http://localhost:${port}`;
            if (port === 8080) {
                // Skip WebSocket port test here as it's tested separately
                logTest(`Port ${port} (${service})`, true, 'WebSocket port reserved');
            } else {
                const response = await axios.get(url, { timeout: 2000 });
                logTest(`Port ${port} (${service})`, response.status === 200, 'Port accessible');
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                logTest(`Port ${port} (${service})`, false, 'Service not running');
            } else {
                logTest(`Port ${port} (${service})`, false, `Error: ${error.message}`);
            }
        }
    }
}

// Main test runner
async function runIntegrationTests() {
    console.log('🧪 Starting Integration Tests for Advanced Drone Surveillance System');
    console.log('====================================================================');

    const startTime = Date.now();

    // Run all tests
    await testServiceHealth();
    await testDatabaseConnectivity();
    await testAIInference();
    await testWebSocketConnectivity();
    await testInterServiceCommunication();
    await testAPIEndpoints();
    await testPortConfiguration();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Display results
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⏱️ Duration: ${duration}s`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    if (testResults.failed === 0) {
        console.log('\n🎉 All tests passed! System is fully integrated and ready for deployment.');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the logs above for details.');
        console.log('\n🔧 Troubleshooting Tips:');
        console.log('- Ensure all Docker containers are running: docker-compose ps');
        console.log('- Check service logs: docker-compose logs [service-name]');
        console.log('- Verify port availability: netstat -an | findstr :5000');
        console.log('- Restart failed services: docker-compose restart [service-name]');
    }

    // Save results to file
    const resultsFile = path.join(__dirname, 'integration-test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        duration: `${duration}s`,
        summary: {
            passed: testResults.passed,
            failed: testResults.failed,
            successRate: `${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`
        },
        tests: testResults.tests
    }, null, 2));

    console.log(`\n📄 Detailed results saved to: ${resultsFile}`);
}

// Run tests if this file is executed directly
if (require.main === module) {
    runIntegrationTests().catch(console.error);
}

module.exports = { runIntegrationTests };
