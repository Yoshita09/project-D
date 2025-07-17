# Military Asset Detection AI Module

This backend service provides real-time detection and classification of military assets from aerial images, designed for integration with autonomous drone swarm operations.

## Features
- REST API for image analysis
- Returns detected objects, bounding boxes, confidence, threat level, geolocation, and timestamp
- Easily extensible for custom models and database integration

## Setup

1. **Install dependencies:**
   ```sh
   python -m venv venv
   venv/Scripts/activate  # On Windows
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```sh
   uvicorn main:app --reload
   ```

3. **Test the API:**
   - Health check: [http://localhost:8000/health](http://localhost:8000/health)
   - Analyze endpoint: POST an image, lat, long, and timestamp to `/analyze`

## Example Request

```json
{
  "timestamp": "2025-07-12T14:30:00Z",
  "coordinates": {"lat": 28.6139, "long": 77.2090},
  "detected_objects": [
    {
      "type": "Tank",
      "bounding_box": [100, 150, 300, 400],
      "confidence": 0.93,
      "threat_level": "High"
    },
    {
      "type": "Soldier",
      "bounding_box": [500, 200, 550, 300],
      "confidence": 0.88,
      "threat_level": "Low"
    }
  ]
}
```

## Next Steps
- Integrate YOLOv8 model for real detections
- Add PostgreSQL storage for detections
- Add endpoints for querying and swarm integration 