import asyncio
import aiohttp
import websockets
import json
import base64
import time
import io
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
FASTAPI_BASE_URL = 'http://localhost:5800'
WEBSOCKET_URL = 'ws://localhost:5800/ws'

class FastAPITester:
    def __init__(self):
        self.session = None
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'tests': []
        }
    
    def log_test(self, test_name, passed, message=''):
        """Log test results"""
        status = '✅ PASS' if passed else '❌ FAIL'
        print(f"{status}: {test_name} {message}")
        
        self.test_results['tests'].append({
            'name': test_name,
            'passed': passed,
            'message': message
        })
        
        if passed:
            self.test_results['passed'] += 1
        else:
            self.test_results['failed'] += 1
    
    def create_test_image(self):
        """Create a simple test image as base64"""
        # Create a simple 100x100 red image
        image = Image.new('RGB', (100, 100), color='red')
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        buffer.seek(0)
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    async def test_health_endpoint(self):
        """Test FastAPI health endpoint"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{FASTAPI_BASE_URL}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        self.log_test('FastAPI Health Check', True, f"Status: {data.get('status')}")
                        return True
                    else:
                        self.log_test('FastAPI Health Check', False, f"Status code: {response.status}")
                        return False
        except Exception as e:
            self.log_test('FastAPI Health Check', False, f"Error: {str(e)}")
            return False
    
    async def test_model_info_endpoint(self):
        """Test model info endpoint"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{FASTAPI_BASE_URL}/model/info") as response:
                    if response.status == 200:
                        data = await response.json()
                        model_type = data.get('model_type', 'Unknown')
                        num_classes = data.get('num_classes', 0)
                        self.log_test('Model Info Endpoint', True, f"Model: {model_type}, Classes: {num_classes}")
                        return True
                    else:
                        self.log_test('Model Info Endpoint', False, f"Status code: {response.status}")
                        return False
        except Exception as e:
            self.log_test('Model Info Endpoint', False, f"Error: {str(e)}")
            return False
    
    async def test_detect_endpoint(self):
        """Test detection endpoint with JSON payload"""
        try:
            test_image = self.create_test_image()
            payload = {
                "image": test_image,
                "drone_id": "test-drone-001",
                "timestamp": time.time()
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{FASTAPI_BASE_URL}/detect",
                    json=payload,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        detection_count = data.get('count', 0)
                        self.log_test('Detection Endpoint (JSON)', True, f"Detections: {detection_count}")
                        return True
                    else:
                        text = await response.text()
                        self.log_test('Detection Endpoint (JSON)', False, f"Status: {response.status}, Response: {text}")
                        return False
        except Exception as e:
            self.log_test('Detection Endpoint (JSON)', False, f"Error: {str(e)}")
            return False
    
    async def test_analyze_endpoint(self):
        """Test analyze endpoint with file upload"""
        try:
            # Create test image file
            image = Image.new('RGB', (100, 100), color='blue')
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG')
            buffer.seek(0)
            
            # Prepare multipart form data
            data = aiohttp.FormData()
            data.add_field('file', buffer, filename='test.jpg', content_type='image/jpeg')
            data.add_field('return_image', 'false')
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{FASTAPI_BASE_URL}/analyze", data=data) as response:
                    if response.status == 200:
                        data = await response.json()
                        detection_count = data.get('count', 0)
                        self.log_test('Analyze Endpoint (File Upload)', True, f"Detections: {detection_count}")
                        return True
                    else:
                        text = await response.text()
                        self.log_test('Analyze Endpoint (File Upload)', False, f"Status: {response.status}, Response: {text}")
                        return False
        except Exception as e:
            self.log_test('Analyze Endpoint (File Upload)', False, f"Error: {str(e)}")
            return False
    
    async def test_batch_analysis_endpoint(self):
        """Test batch analysis endpoint"""
        try:
            test_images = [self.create_test_image(), self.create_test_image()]
            payload = {"images": test_images}
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{FASTAPI_BASE_URL}/analyze/batch",
                    json=payload,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        total_images = data.get('total_images', 0)
                        self.log_test('Batch Analysis Endpoint', True, f"Processed {total_images} images")
                        return True
                    else:
                        text = await response.text()
                        self.log_test('Batch Analysis Endpoint', False, f"Status: {response.status}, Response: {text}")
                        return False
        except Exception as e:
            self.log_test('Batch Analysis Endpoint', False, f"Error: {str(e)}")
            return False
    
    async def test_stats_endpoint(self):
        """Test stats endpoint"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{FASTAPI_BASE_URL}/stats") as response:
                    if response.status == 200:
                        data = await response.json()
                        service_name = data.get('service', 'Unknown')
                        model_loaded = data.get('model_loaded', False)
                        self.log_test('Stats Endpoint', True, f"Service: {service_name}, Model loaded: {model_loaded}")
                        return True
                    else:
                        self.log_test('Stats Endpoint', False, f"Status code: {response.status}")
                        return False
        except Exception as e:
            self.log_test('Stats Endpoint', False, f"Error: {str(e)}")
            return False
    
    async def test_websocket_connection(self):
        """Test WebSocket connection and communication"""
        try:
            async with websockets.connect(WEBSOCKET_URL) as websocket:
                self.log_test('WebSocket Connection', True, 'Connected successfully')
                
                # Test detection request via WebSocket
                test_image = self.create_test_image()
                message = {
                    "type": "detection_request",
                    "image": test_image,
                    "timestamp": time.time()
                }
                
                await websocket.send(json.dumps(message))
                
                # Wait for response
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    data = json.loads(response)
                    
                    if data.get('type') == 'detection_results':
                        results_count = len(data.get('results', []))
                        self.log_test('WebSocket Detection', True, f"Received {results_count} detection results")
                        return True
                    else:
                        self.log_test('WebSocket Detection', False, f"Unexpected response type: {data.get('type')}")
                        return False
                        
                except asyncio.TimeoutError:
                    self.log_test('WebSocket Detection', False, 'Timeout waiting for response')
                    return False
                    
        except Exception as e:
            self.log_test('WebSocket Connection', False, f"Error: {str(e)}")
            return False
    
    async def test_docs_endpoint(self):
        """Test FastAPI automatic documentation endpoint"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{FASTAPI_BASE_URL}/docs") as response:
                    if response.status == 200:
                        self.log_test('FastAPI Docs Endpoint', True, 'Swagger UI accessible')
                        return True
                    else:
                        self.log_test('FastAPI Docs Endpoint', False, f"Status code: {response.status}")
                        return False
        except Exception as e:
            self.log_test('FastAPI Docs Endpoint', False, f"Error: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run all FastAPI tests"""
        print('🧪 Starting FastAPI AI Inference Service Tests')
        print('=' * 50)
        
        start_time = time.time()
        
        # Run all tests
        await self.test_health_endpoint()
        await self.test_model_info_endpoint()
        await self.test_detect_endpoint()
        await self.test_analyze_endpoint()
        await self.test_batch_analysis_endpoint()
        await self.test_stats_endpoint()
        await self.test_websocket_connection()
        await self.test_docs_endpoint()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Display results
        print('\n📊 FastAPI Test Results Summary')
        print('=' * 35)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"⏱️ Duration: {duration:.2f}s")
        
        total_tests = self.test_results['passed'] + self.test_results['failed']
        if total_tests > 0:
            success_rate = (self.test_results['passed'] / total_tests) * 100
            print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.test_results['failed'] == 0:
            print('\n🎉 All FastAPI tests passed! Service is working correctly.')
            print('\n🌐 FastAPI Service URLs:')
            print(f"   - Health Check: {FASTAPI_BASE_URL}/health")
            print(f"   - API Documentation: {FASTAPI_BASE_URL}/docs")
            print(f"   - Interactive API: {FASTAPI_BASE_URL}/redoc")
            print(f"   - WebSocket: {WEBSOCKET_URL}")
        else:
            print('\n⚠️ Some FastAPI tests failed. Check the logs above for details.')
            print('\n🔧 Troubleshooting:')
            print('   - Ensure FastAPI service is running: uvicorn ai_inference_service:app --host 0.0.0.0 --port 5800')
            print('   - Check service logs for errors')
            print('   - Verify YOLOv8 model is properly loaded')
        
        return self.test_results['failed'] == 0

async def main():
    """Main test runner"""
    tester = FastAPITester()
    success = await tester.run_all_tests()
    
    if success:
        print('\n✅ FastAPI AI Inference Service is fully functional!')
    else:
        print('\n❌ FastAPI AI Inference Service has issues that need to be resolved.')
    
    return success

if __name__ == "__main__":
    asyncio.run(main())
