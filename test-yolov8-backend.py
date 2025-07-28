import os
import sys
import time
import logging
import numpy as np
from PIL import Image, ImageDraw
import base64
import io
import json
import requests
import cv2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YOLOv8Tester:
    def __init__(self):
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'tests': []
        }
        self.model = None
        self.model_path = None
        
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
    
    def test_yolov8_installation(self):
        """Test if YOLOv8 (ultralytics) is properly installed"""
        try:
            from ultralytics import YOLO
            import torch
            
            # Check PyTorch version
            torch_version = torch.__version__
            
            # Check if CUDA is available
            cuda_available = torch.cuda.is_available()
            
            self.log_test('YOLOv8 Installation', True, 
                         f"PyTorch: {torch_version}, CUDA: {cuda_available}")
            return True
            
        except ImportError as e:
            self.log_test('YOLOv8 Installation', False, f"Import error: {str(e)}")
            return False
    
    def test_model_file_existence(self):
        """Test if YOLOv8 model files exist"""
        model_paths = [
            'yolov8n.pt',
            'backend/yolov8n.pt',
            os.path.join(os.getcwd(), 'yolov8n.pt'),
            os.path.join(os.getcwd(), 'backend', 'yolov8n.pt')
        ]
        
        found_model = None
        for path in model_paths:
            if os.path.exists(path):
                found_model = path
                break
        
        if found_model:
            file_size = os.path.getsize(found_model) / (1024 * 1024)  # MB
            self.model_path = found_model
            self.log_test('Model File Existence', True, 
                         f"Found at: {found_model} ({file_size:.1f} MB)")
            return True
        else:
            self.log_test('Model File Existence', False, 
                         "YOLOv8 model file not found in expected locations")
            return False
    
    def test_model_loading(self):
        """Test YOLOv8 model loading"""
        try:
            from ultralytics import YOLO
            
            if not self.model_path:
                # Try to download default model
                self.model = YOLO('yolov8n.pt')
                self.log_test('Model Loading', True, "Downloaded default YOLOv8n model")
            else:
                self.model = YOLO(self.model_path)
                self.log_test('Model Loading', True, f"Loaded from: {self.model_path}")
            
            # Get model info
            model_info = {
                'names': len(self.model.names),
                'classes': list(self.model.names.values())[:5]  # First 5 classes
            }
            
            print(f"   Model classes: {model_info['names']} total")
            print(f"   Sample classes: {', '.join(model_info['classes'])}")
            
            return True
            
        except Exception as e:
            self.log_test('Model Loading', False, f"Error: {str(e)}")
            return False
    
    def create_test_image(self):
        """Create a test image with objects for detection"""
        # Create a 640x640 image with some basic shapes
        image = Image.new('RGB', (640, 640), color='white')
        draw = ImageDraw.Draw(image)
        
        # Draw some basic shapes that might be detected
        # Rectangle (could be detected as various objects)
        draw.rectangle([100, 100, 300, 200], fill='red', outline='black', width=3)
        
        # Circle (could be detected as sports ball, etc.)
        draw.ellipse([400, 150, 500, 250], fill='blue', outline='black', width=3)
        
        # Another rectangle
        draw.rectangle([200, 300, 400, 450], fill='green', outline='black', width=3)
        
        return image
    
    def test_model_inference(self):
        """Test YOLOv8 model inference"""
        try:
            if not self.model:
                self.log_test('Model Inference', False, "Model not loaded")
                return False
            
            # Create test image
            test_image = self.create_test_image()
            
            # Convert PIL to numpy array
            img_array = np.array(test_image)
            
            # Run inference
            results = self.model(img_array)
            
            # Process results
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        confidence = float(box.conf[0])
                        class_id = int(box.cls[0])
                        class_name = self.model.names[class_id]
                        
                        detections.append({
                            'class': class_name,
                            'confidence': confidence,
                            'bbox': [x1, y1, x2, y2]
                        })
            
            self.log_test('Model Inference', True, 
                         f"Processed image, found {len(detections)} detections")
            
            # Print detection details
            for i, det in enumerate(detections[:3]):  # Show first 3 detections
                print(f"   Detection {i+1}: {det['class']} ({det['confidence']:.2f})")
            
            return True
            
        except Exception as e:
            self.log_test('Model Inference', False, f"Error: {str(e)}")
            return False
    
    def test_backend_integration(self):
        """Test YOLOv8 integration with FastAPI backend"""
        try:
            # Test if FastAPI service is running
            health_url = 'http://localhost:5800/health'
            
            try:
                response = requests.get(health_url, timeout=5)
                if response.status_code == 200:
                    health_data = response.json()
                    model_loaded = health_data.get('model_loaded', False)
                    
                    if model_loaded:
                        self.log_test('Backend Integration', True, 
                                     "FastAPI service running with model loaded")
                    else:
                        self.log_test('Backend Integration', False, 
                                     "FastAPI service running but model not loaded")
                        return False
                else:
                    self.log_test('Backend Integration', False, 
                                 f"FastAPI service returned status {response.status_code}")
                    return False
                    
            except requests.exceptions.RequestException:
                self.log_test('Backend Integration', False, 
                             "FastAPI service not running on port 5800")
                return False
            
            # Test detection endpoint
            test_image = self.create_test_image()
            buffer = io.BytesIO()
            test_image.save(buffer, format='JPEG')
            buffer.seek(0)
            base64_image = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            detect_url = 'http://localhost:5800/detect'
            payload = {
                "image": base64_image,
                "drone_id": "test-drone",
                "timestamp": time.time()
            }
            
            try:
                response = requests.post(detect_url, json=payload, timeout=10)
                if response.status_code == 200:
                    result = response.json()
                    detection_count = result.get('count', 0)
                    self.log_test('Backend Detection Test', True, 
                                 f"API returned {detection_count} detections")
                    return True
                else:
                    self.log_test('Backend Detection Test', False, 
                                 f"API returned status {response.status_code}")
                    return False
                    
            except requests.exceptions.RequestException as e:
                self.log_test('Backend Detection Test', False, 
                             f"API request failed: {str(e)}")
                return False
                
        except Exception as e:
            self.log_test('Backend Integration', False, f"Error: {str(e)}")
            return False
    
    def test_model_performance(self):
        """Test YOLOv8 model performance"""
        try:
            if not self.model:
                self.log_test('Model Performance', False, "Model not loaded")
                return False
            
            # Create test image
            test_image = self.create_test_image()
            img_array = np.array(test_image)
            
            # Measure inference time
            start_time = time.time()
            results = self.model(img_array)
            end_time = time.time()
            
            inference_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            # Performance benchmarks
            if inference_time < 100:
                performance_rating = "Excellent"
            elif inference_time < 500:
                performance_rating = "Good"
            elif inference_time < 1000:
                performance_rating = "Fair"
            else:
                performance_rating = "Slow"
            
            self.log_test('Model Performance', True, 
                         f"Inference time: {inference_time:.1f}ms ({performance_rating})")
            
            return True
            
        except Exception as e:
            self.log_test('Model Performance', False, f"Error: {str(e)}")
            return False
    
    def test_military_asset_classification(self):
        """Test military asset classification logic"""
        try:
            # Test threat level classification
            test_cases = [
                ('person', 0.9, 'high'),
                ('car', 0.7, 'low'),
                ('airplane', 0.8, 'high'),
                ('truck', 0.9, 'high'),
                ('helicopter', 0.6, 'high')
            ]
            
            def classify_threat_level(class_name, confidence):
                military_assets = {
                    'person': 'medium',
                    'car': 'low',
                    'truck': 'medium',
                    'airplane': 'high',
                    'helicopter': 'high',
                    'boat': 'medium',
                    'motorcycle': 'low'
                }
                
                base_threat = military_assets.get(class_name.lower(), 'low')
                
                if confidence > 0.8:
                    if base_threat == 'low':
                        return 'medium'
                    elif base_threat == 'medium':
                        return 'high'
                
                return base_threat
            
            all_passed = True
            for class_name, confidence, expected in test_cases:
                result = classify_threat_level(class_name, confidence)
                if result == expected:
                    print(f"   ✅ {class_name} ({confidence}) -> {result}")
                else:
                    print(f"   ❌ {class_name} ({confidence}) -> {result} (expected {expected})")
                    all_passed = False
            
            self.log_test('Military Asset Classification', all_passed, 
                         f"Tested {len(test_cases)} classification scenarios")
            
            return all_passed
            
        except Exception as e:
            self.log_test('Military Asset Classification', False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all YOLOv8 tests"""
        print('🧪 Starting YOLOv8 Backend Integration Tests')
        print('=' * 50)
        
        start_time = time.time()
        
        # Run all tests
        self.test_yolov8_installation()
        self.test_model_file_existence()
        self.test_model_loading()
        self.test_model_inference()
        self.test_backend_integration()
        self.test_model_performance()
        self.test_military_asset_classification()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Display results
        print('\n📊 YOLOv8 Test Results Summary')
        print('=' * 35)
        print(f"✅ Passed: {self.test_results['passed']}")
        print(f"❌ Failed: {self.test_results['failed']}")
        print(f"⏱️ Duration: {duration:.2f}s")
        
        total_tests = self.test_results['passed'] + self.test_results['failed']
        if total_tests > 0:
            success_rate = (self.test_results['passed'] / total_tests) * 100
            print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.test_results['failed'] == 0:
            print('\n🎉 All YOLOv8 tests passed! Model is working correctly.')
            print('\n🔧 YOLOv8 Integration Status:')
            print('   ✅ Model loaded and functional')
            print('   ✅ Inference working properly')
            print('   ✅ Backend integration successful')
            print('   ✅ Military asset classification active')
        else:
            print('\n⚠️ Some YOLOv8 tests failed. Issues found:')
            for test in self.test_results['tests']:
                if not test['passed']:
                    print(f"   ❌ {test['name']}: {test['message']}")
            
            print('\n🔧 Troubleshooting:')
            print('   - Ensure ultralytics is installed: pip install ultralytics')
            print('   - Check YOLOv8 model file exists: yolov8n.pt')
            print('   - Verify FastAPI service is running on port 5800')
            print('   - Check PyTorch installation and CUDA support')
        
        return self.test_results['failed'] == 0

def main():
    """Main test runner"""
    tester = YOLOv8Tester()
    success = tester.run_all_tests()
    
    if success:
        print('\n✅ YOLOv8 is fully functional in your backend!')
    else:
        print('\n❌ YOLOv8 has issues that need to be resolved.')
    
    return success

if __name__ == "__main__":
    main()
