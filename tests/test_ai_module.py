"""
Unit tests for AI Module (FastAPI service)
Tests YOLOv8 model, API endpoints, and performance metrics
"""

import pytest
import asyncio
import aiohttp
import numpy as np
from PIL import Image
import io
import json
import time
from pathlib import Path
import sys

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from tests import TEST_CONFIG

class TestAIModule:
    """Comprehensive tests for AI Module functionality"""
    
    @pytest.fixture
    async def client(self):
        """Create aiohttp client for testing"""
        async with aiohttp.ClientSession() as session:
            yield session
    
    @pytest.fixture
    def test_image(self):
        """Create a test image for AI analysis"""
        # Create a simple test image
        img_array = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
        img = Image.fromarray(img_array)
        
        # Save to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        
        return img_bytes.getvalue()
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, client):
        """Test health check endpoint"""
        async with client.get(f"{TEST_CONFIG['ai_url']}/health") as response:
            assert response.status == 200
            data = await response.json()
            assert "status" in data
            assert "timestamp" in data
            assert "version" in data
            assert "model_status" in data
            print(f"✅ Health check passed: {data}")
    
    @pytest.mark.asyncio
    async def test_stats_endpoint(self, client):
        """Test statistics endpoint"""
        async with client.get(f"{TEST_CONFIG['ai_url']}/stats") as response:
            assert response.status == 200
            data = await response.json()
            assert "total_detections" in data
            assert "average_confidence" in data
            assert "threat_distribution" in data
            assert "processing_times" in data
            print(f"✅ Stats endpoint passed: {data}")
    
    @pytest.mark.asyncio
    async def test_analyze_endpoint(self, client, test_image):
        """Test image analysis endpoint"""
        # Prepare form data
        data = aiohttp.FormData()
        data.add_field('file', test_image, filename='test.jpg', content_type='image/jpeg')
        data.add_field('lat', '28.6139')
        data.add_field('long', '77.2090')
        data.add_field('timestamp', '2024-01-15T10:30:00Z')
        
        async with client.post(f"{TEST_CONFIG['ai_url']}/analyze", data=data) as response:
            assert response.status == 200
            result = await response.json()
            
            # Validate response structure
            assert "timestamp" in result
            assert "coordinates" in result
            assert "detected_objects" in result
            assert "analysis_metadata" in result
            
            # Validate coordinates
            coords = result["coordinates"]
            assert "lat" in coords
            assert "long" in coords
            assert float(coords["lat"]) == 28.6139
            assert float(coords["long"]) == 77.2090
            
            # Validate metadata
            metadata = result["analysis_metadata"]
            assert "processing_time" in metadata
            assert "model_version" in metadata
            assert "total_objects" in metadata
            
            print(f"✅ Analyze endpoint passed: {len(result['detected_objects'])} objects detected")
    
    @pytest.mark.asyncio
    async def test_describe_endpoint(self, client, test_image):
        """Test image description endpoint"""
        # Prepare form data
        data = aiohttp.FormData()
        data.add_field('file', test_image, filename='test.jpg', content_type='image/jpeg')
        
        async with client.post(f"{TEST_CONFIG['ai_url']}/describe", data=data) as response:
            assert response.status == 200
            result = await response.json()
            
            # Validate response structure
            assert "description" in result
            assert "detected_objects" in result
            assert isinstance(result["description"], str)
            assert isinstance(result["detected_objects"], list)
            
            print(f"✅ Describe endpoint passed: {result['description']}")
    
    @pytest.mark.asyncio
    async def test_detections_endpoint(self, client):
        """Test detections history endpoint"""
        async with client.get(f"{TEST_CONFIG['ai_url']}/detections?limit=5") as response:
            assert response.status == 200
            result = await response.json()
            
            # Validate response structure
            assert "detections" in result
            assert "total" in result
            assert isinstance(result["detections"], list)
            assert isinstance(result["total"], int)
            
            print(f"✅ Detections endpoint passed: {result['total']} detections retrieved")
    
    @pytest.mark.asyncio
    async def test_invalid_file_type(self, client):
        """Test error handling for invalid file types"""
        # Create invalid data
        data = aiohttp.FormData()
        data.add_field('file', b'invalid data', filename='test.txt', content_type='text/plain')
        data.add_field('lat', '28.6139')
        data.add_field('long', '77.2090')
        
        async with client.post(f"{TEST_CONFIG['ai_url']}/analyze", data=data) as response:
            assert response.status == 400
            result = await response.json()
            assert "detail" in result
            print(f"✅ Invalid file type error handling passed: {result['detail']}")
    
    @pytest.mark.asyncio
    async def test_missing_parameters(self, client, test_image):
        """Test error handling for missing parameters"""
        # Test missing coordinates
        data = aiohttp.FormData()
        data.add_field('file', test_image, filename='test.jpg', content_type='image/jpeg')
        # Missing lat and long
        
        async with client.post(f"{TEST_CONFIG['ai_url']}/analyze", data=data) as response:
            assert response.status == 422  # Validation error
            print("✅ Missing parameters error handling passed")
    
    @pytest.mark.asyncio
    async def test_performance_metrics(self, client, test_image):
        """Test performance metrics and response times"""
        performance_results = []
        
        # Run multiple requests to test performance
        for i in range(5):
            start_time = time.time()
            
            data = aiohttp.FormData()
            data.add_field('file', test_image, filename=f'test_{i}.jpg', content_type='image/jpeg')
            data.add_field('lat', '28.6139')
            data.add_field('long', '77.2090')
            
            async with client.post(f"{TEST_CONFIG['ai_url']}/analyze", data=data) as response:
                end_time = time.time()
                processing_time = end_time - start_time
                
                assert response.status == 200
                result = await response.json()
                
                # Extract processing time from response
                metadata = result["analysis_metadata"]
                api_processing_time = metadata.get("processing_time", 0)
                
                performance_results.append({
                    "request_time": processing_time,
                    "api_processing_time": api_processing_time,
                    "objects_detected": len(result["detected_objects"])
                })
        
        # Calculate performance metrics
        avg_request_time = sum(r["request_time"] for r in performance_results) / len(performance_results)
        avg_api_time = sum(r["api_processing_time"] for r in performance_results) / len(performance_results)
        total_objects = sum(r["objects_detected"] for r in performance_results)
        
        print(f"✅ Performance test completed:")
        print(f"   Average request time: {avg_request_time:.3f}s")
        print(f"   Average API processing time: {avg_api_time:.3f}s")
        print(f"   Total objects detected: {total_objects}")
        
        # Performance assertions
        assert avg_request_time < 5.0  # Should complete within 5 seconds
        assert avg_api_time < 2.0      # AI processing should be under 2 seconds
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self, client, test_image):
        """Test system performance under concurrent load"""
        async def make_request(session, request_id):
            data = aiohttp.FormData()
            data.add_field('file', test_image, filename=f'concurrent_{request_id}.jpg', content_type='image/jpeg')
            data.add_field('lat', '28.6139')
            data.add_field('long', '77.2090')
            
            start_time = time.time()
            async with session.post(f"{TEST_CONFIG['ai_url']}/analyze", data=data) as response:
                end_time = time.time()
                result = await response.json()
                return {
                    "request_id": request_id,
                    "status": response.status,
                    "processing_time": end_time - start_time,
                    "objects_detected": len(result.get("detected_objects", []))
                }
        
        # Make 10 concurrent requests
        tasks = [make_request(client, i) for i in range(10)]
        results = await asyncio.gather(*tasks)
        
        # Analyze results
        successful_requests = [r for r in results if r["status"] == 200]
        failed_requests = [r for r in results if r["status"] != 200]
        
        avg_processing_time = sum(r["processing_time"] for r in successful_requests) / len(successful_requests) if successful_requests else 0
        total_objects = sum(r["objects_detected"] for r in successful_requests)
        
        print(f"✅ Concurrent load test completed:")
        print(f"   Successful requests: {len(successful_requests)}/10")
        print(f"   Failed requests: {len(failed_requests)}/10")
        print(f"   Average processing time: {avg_processing_time:.3f}s")
        print(f"   Total objects detected: {total_objects}")
        
        # Assertions for concurrent performance
        assert len(successful_requests) >= 8  # At least 80% success rate
        assert avg_processing_time < 10.0     # Should handle concurrent load reasonably
    
    @pytest.mark.asyncio
    async def test_api_documentation(self, client):
        """Test API documentation endpoints"""
        # Test Swagger UI
        async with client.get(f"{TEST_CONFIG['ai_url']}/docs") as response:
            assert response.status == 200
            content = await response.text()
            assert "swagger" in content.lower()
            print("✅ Swagger UI documentation accessible")
        
        # Test OpenAPI schema
        async with client.get(f"{TEST_CONFIG['ai_url']}/openapi.json") as response:
            assert response.status == 200
            schema = await response.json()
            assert "openapi" in schema
            assert "paths" in schema
            assert "components" in schema
            print("✅ OpenAPI schema accessible")
    
    @pytest.mark.asyncio
    async def test_model_inference_accuracy(self, client, test_image):
        """Test model inference accuracy and consistency"""
        results = []
        
        # Run multiple inferences on the same image
        for i in range(3):
            data = aiohttp.FormData()
            data.add_field('file', test_image, filename=f'accuracy_test_{i}.jpg', content_type='image/jpeg')
            data.add_field('lat', '28.6139')
            data.add_field('long', '77.2090')
            
            async with client.post(f"{TEST_CONFIG['ai_url']}/analyze", data=data) as response:
                result = await response.json()
                results.append(result)
        
        # Check consistency across runs
        object_counts = [len(r["detected_objects"]) for r in results]
        processing_times = [r["analysis_metadata"]["processing_time"] for r in results]
        
        # All runs should have similar results
        assert max(object_counts) - min(object_counts) <= 1  # Allow for minor variations
        assert max(processing_times) - min(processing_times) < 1.0  # Processing time should be consistent
        
        print(f"✅ Model inference accuracy test passed:")
        print(f"   Object counts: {object_counts}")
        print(f"   Processing times: {[f'{t:.3f}s' for t in processing_times]}")

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"]) 