#!/usr/bin/env python3
"""
Military Asset Training Script
Trains custom YOLOv8 models for military asset detection
"""

import os
import yaml
import shutil
from pathlib import Path
from ultralytics import YOLO
import cv2
import numpy as np
from sklearn.model_selection import train_test_split
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)

class MilitaryModelTrainer:
    def __init__(self, config_path='training_config.yaml'):
        self.config = self.load_config(config_path)
        self.model = None
        self.logger = logging.getLogger(__name__)
        
        # Create directories
        self.setup_directories()
    
    def load_config(self, config_path):
        """Load training configuration"""
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        else:
            # Default configuration
            return {
                'model_type': 'yolov8m.pt',
                'epochs': 100,
                'batch_size': 16,
                'img_size': 640,
                'learning_rate': 0.01,
                'patience': 50,
                'save_period': 10,
                'classes': [
                    'tank', 'apc', 'artillery', 'missile_launcher', 
                    'radar', 'air_defense', 'helicopter', 'fighter_jet',
                    'drone', 'soldier', 'vehicle', 'building'
                ],
                'data_path': 'datasets/military_assets',
                'output_path': 'models/military_detector'
            }
    
    def setup_directories(self):
        """Create necessary directories"""
        directories = [
            'datasets/military_assets',
            'datasets/military_assets/images',
            'datasets/military_assets/labels',
            'datasets/military_assets/images/train',
            'datasets/military_assets/images/val',
            'datasets/military_assets/labels/train',
            'datasets/military_assets/labels/val',
            'models/military_detector',
            'logs'
        ]
        
        for directory in directories:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    def prepare_dataset(self, images_path, labels_path):
        """Prepare dataset for training"""
        self.logger.info("Preparing dataset...")
        
        # Get all image files
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        images = []
        
        for ext in image_extensions:
            images.extend(Path(images_path).glob(f'*{ext}'))
            images.extend(Path(images_path).glob(f'*{ext.upper()}'))
        
        if not images:
            self.logger.error("No images found in dataset")
            return False
        
        # Split into train/val
        train_images, val_images = train_test_split(
            images, test_size=0.2, random_state=42
        )
        
        # Copy images to train/val directories
        for img_path in train_images:
            shutil.copy2(img_path, f'datasets/military_assets/images/train/{img_path.name}')
            # Copy corresponding label if exists
            label_path = Path(labels_path) / f'{img_path.stem}.txt'
            if label_path.exists():
                shutil.copy2(label_path, f'datasets/military_assets/labels/train/{label_path.name}')
        
        for img_path in val_images:
            shutil.copy2(img_path, f'datasets/military_assets/images/val/{img_path.name}')
            # Copy corresponding label if exists
            label_path = Path(labels_path) / f'{img_path.stem}.txt'
            if label_path.exists():
                shutil.copy2(label_path, f'datasets/military_assets/labels/val/{label_path.name}')
        
        self.logger.info(f"Dataset prepared: {len(train_images)} train, {len(val_images)} val images")
        return True
    
    def create_dataset_yaml(self):
        """Create dataset.yaml file for YOLO training"""
        dataset_config = {
            'path': 'datasets/military_assets',
            'train': 'images/train',
            'val': 'images/val',
            'nc': len(self.config['classes']),
            'names': self.config['classes']
        }
        
        with open('datasets/military_assets/dataset.yaml', 'w') as f:
            yaml.dump(dataset_config, f, default_flow_style=False)
        
        self.logger.info("Dataset YAML created")
    
    def train_model(self):
        """Train the military asset detection model"""
        self.logger.info("Starting model training...")
        
        # Load base model
        self.model = YOLO(self.config['model_type'])
        
        # Training parameters
        train_args = {
            'data': 'datasets/military_assets/dataset.yaml',
            'epochs': self.config['epochs'],
            'batch': self.config['batch_size'],
            'imgsz': self.config['img_size'],
            'lr0': self.config['learning_rate'],
            'patience': self.config['patience'],
            'save_period': self.config['save_period'],
            'project': self.config['output_path'],
            'name': 'military_detector',
            'exist_ok': True,
            'pretrained': True,
            'optimizer': 'Adam',
            'cos_lr': True,
            'close_mosaic': 10,
            'amp': True
        }
        
        # Start training
        try:
            results = self.model.train(**train_args)
            self.logger.info("Training completed successfully")
            return results
        except Exception as e:
            self.logger.error(f"Training failed: {e}")
            return None
    
    def evaluate_model(self, model_path=None):
        """Evaluate the trained model"""
        if model_path is None:
            model_path = f"{self.config['output_path']}/military_detector/weights/best.pt"
        
        if not os.path.exists(model_path):
            self.logger.error(f"Model not found: {model_path}")
            return None
        
        self.logger.info("Evaluating model...")
        
        # Load trained model
        model = YOLO(model_path)
        
        # Run validation
        metrics = model.val()
        
        # Save evaluation results
        evaluation_results = {
            'model_path': model_path,
            'metrics': {
                'mAP50': float(metrics.box.map50),
                'mAP50-95': float(metrics.box.map),
                'precision': float(metrics.box.mp),
                'recall': float(metrics.box.mr)
            },
            'classes': self.config['classes']
        }
        
        with open(f"{self.config['output_path']}/evaluation_results.json", 'w') as f:
            json.dump(evaluation_results, f, indent=2)
        
        self.logger.info(f"Evaluation completed: mAP50 = {evaluation_results['metrics']['mAP50']:.3f}")
        return evaluation_results
    
    def export_model(self, model_path=None, format='onnx'):
        """Export model to different formats"""
        if model_path is None:
            model_path = f"{self.config['output_path']}/military_detector/weights/best.pt"
        
        if not os.path.exists(model_path):
            self.logger.error(f"Model not found: {model_path}")
            return None
        
        self.logger.info(f"Exporting model to {format} format...")
        
        model = YOLO(model_path)
        export_path = model.export(format=format)
        
        self.logger.info(f"Model exported to: {export_path}")
        return export_path
    
    def create_inference_script(self):
        """Create inference script for the trained model"""
        inference_script = '''#!/usr/bin/env python3
"""
Military Asset Detection Inference Script
Uses trained model for real-time detection
"""

import cv2
import numpy as np
from ultralytics import YOLO
import json
import argparse

def load_model(model_path):
    """Load the trained military detection model"""
    return YOLO(model_path)

def detect_assets(model, image_path, confidence=0.5):
    """Detect military assets in image"""
    results = model(image_path, conf=confidence)
    
    detections = []
    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                detection = {
                    'class': model.names[int(box.cls)],
                    'confidence': float(box.conf),
                    'bbox': box.xyxy[0].tolist(),
                    'class_id': int(box.cls)
                }
                detections.append(detection)
    
    return detections

def main():
    parser = argparse.ArgumentParser(description='Military Asset Detection')
    parser.add_argument('--model', required=True, help='Path to trained model')
    parser.add_argument('--image', required=True, help='Path to input image')
    parser.add_argument('--conf', type=float, default=0.5, help='Confidence threshold')
    parser.add_argument('--output', help='Output JSON file path')
    
    args = parser.parse_args()
    
    # Load model
    model = load_model(args.model)
    
    # Run detection
    detections = detect_assets(model, args.image, args.conf)
    
    # Save results
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(detections, f, indent=2)
    
    print(json.dumps(detections, indent=2))

if __name__ == '__main__':
    main()
'''
        
        with open('military_inference.py', 'w') as f:
            f.write(inference_script)
        
        self.logger.info("Inference script created: military_inference.py")

def main():
    """Main training function"""
    trainer = MilitaryModelTrainer()
    
    # Check if dataset exists
    if not os.path.exists('datasets/military_assets/images/train'):
        print("Please prepare your dataset first:")
        print("1. Place images in datasets/military_assets/images/")
        print("2. Place labels in datasets/military_assets/labels/")
        print("3. Run: python train_military_model.py --prepare-dataset")
        return
    
    # Create dataset YAML
    trainer.create_dataset_yaml()
    
    # Train model
    results = trainer.train_model()
    
    if results:
        # Evaluate model
        evaluation = trainer.evaluate_model()
        
        # Export model
        trainer.export_model()
        
        # Create inference script
        trainer.create_inference_script()
        
        print("Training completed successfully!")
        print("Model saved to: models/military_detector/military_detector/weights/")
        print("Use military_inference.py for inference")

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Military Asset Detection Model')
    parser.add_argument('--prepare-dataset', action='store_true', 
                       help='Prepare dataset from raw images and labels')
    parser.add_argument('--images', help='Path to images directory')
    parser.add_argument('--labels', help='Path to labels directory')
    
    args = parser.parse_args()
    
    if args.prepare_dataset:
        if not args.images or not args.labels:
            print("Please provide --images and --labels paths")
            exit(1)
        
        trainer = MilitaryModelTrainer()
        success = trainer.prepare_dataset(args.images, args.labels)
        if success:
            print("Dataset prepared successfully!")
        else:
            print("Dataset preparation failed!")
    else:
        main() 