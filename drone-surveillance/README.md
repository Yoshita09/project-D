# 🛸 Border Security Drone Surveillance System

A comprehensive React-based drone surveillance simulation system for border security operations. This application simulates real-time drone monitoring, thermal imaging, illegal activity detection, and border patrol management.

## 🌟 Features

### 🎯 Core Functionality
- **Real-time Drone Monitoring**: Live tracking of drone position, battery, altitude, and speed
- **Thermal Imaging System**: 3D thermal signature detection with temperature mapping
- **Illegal Activity Detection**: Simulated detection of unauthorized border crossings and suspicious activities
- **Interactive Map**: Live surveillance map with patrol routes and threat indicators
- **Alert Management**: Comprehensive alert system with filtering and priority levels
- **Drone Controls**: Manual and automated flight controls with emergency protocols

### 📊 Dashboard Features
- Real-time activity monitoring charts
- Drone status indicators
- Alert statistics and categorization
- Coverage area tracking
- Quick action buttons for emergency responses

### 🗺️ Map Features
- Interactive OpenStreetMap integration
- Border line visualization
- Patrol route tracking
- Real-time threat markers
- Drone position tracking
- Activity heat maps

### 🔥 Thermal Imaging
- 3D thermal signature visualization
- Temperature-based color coding
- Multiple viewing modes (Normal, Enhanced, Night Vision)
- Human, vehicle, and unknown signature detection
- Interactive thermal target selection

### 🚨 Alert System
- Real-time alert generation
- Alert categorization (Illegal, Thermal, Movement)
- Priority level assignment
- Filtering and sorting capabilities
- Alert acknowledgment and management
- Export functionality

### 🎮 Drone Controls
- Manual flight controls
- Automated patrol modes
- Emergency protocols (Return to Base, Emergency Landing, Kill Switch)
- Waypoint management
- Camera mode switching
- Recording controls

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd drone-surveillance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to view the application

## 📁 Project Structure

```
drone-surveillance/
├── src/
│   ├── components/
│   │   ├── DroneDashboard.jsx      # Main dashboard with charts and status
│   │   ├── SurveillanceMap.jsx     # Interactive map with live tracking
│   │   ├── ThermalView.jsx         # 3D thermal imaging system
│   │   ├── AlertPanel.jsx          # Alert management interface
│   │   └── DroneControls.jsx       # Flight control system
│   ├── App.jsx                     # Main application component
│   ├── App.css                     # Comprehensive styling
│   ├── main.jsx                    # Application entry point
│   └── index.css                   # Global styles
├── public/                         # Static assets
├── package.json                    # Dependencies and scripts
└── README.md                       # Project documentation
```

## 🛠️ Technologies Used

### Frontend
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Three.js**: 3D graphics for thermal visualization
- **React Three Fiber**: React renderer for Three.js
- **Leaflet**: Interactive maps
- **React Leaflet**: React components for Leaflet
- **Chart.js**: Data visualization and real-time charts
- **React Chart.js 2**: React wrapper for Chart.js

### Styling
- **CSS3**: Modern CSS with Grid, Flexbox, and animations
- **Glassmorphism**: Modern UI design with backdrop blur effects
- **Responsive Design**: Mobile-first approach with breakpoints

## 🎮 Usage Guide

### Dashboard
- View real-time drone status and battery levels
- Monitor activity charts and alert statistics
- Access quick action buttons for emergency responses
- Track coverage area and patrol progress

### Live Map
- Observe drone movement along patrol routes
- View border lines and restricted areas
- Monitor real-time threat indicators
- Interact with map markers for detailed information

### Thermal View
- Switch between different thermal imaging modes
- Click on thermal signatures for detailed information
- View temperature-based color coding
- Navigate 3D environment with mouse controls

### Alert Management
- Filter alerts by type (Illegal, Thermal, Movement)
- Sort alerts by time, intensity, or type
- Acknowledge and manage alerts
- Export alert reports

### Drone Controls
- Switch between manual and automated modes
- Control altitude and speed manually
- Set waypoints for patrol routes
- Use emergency protocols when needed
- Switch camera modes and start/stop recording

## 🔧 Configuration

### Map Configuration
The application uses OpenStreetMap tiles. You can customize the map by modifying the `SurveillanceMap.jsx` component:

```javascript
// Change default coordinates
const defaultLocation = { lat: YOUR_LAT, lng: YOUR_LNG }

// Modify patrol route coordinates
const patrolCoordinates = [
  [lat1, lng1],
  [lat2, lng2],
  // ... more coordinates
]
```

### Alert Simulation
Adjust alert frequency and types in the respective components:

```javascript
// In SurveillanceMap.jsx
if (Math.random() < 0.3) { // 30% chance of activity
  // Generate alert
}

// In ThermalView.jsx
if (Math.random() < 0.4) { // 40% chance of thermal activity
  // Generate thermal alert
}
```

### Drone Parameters
Modify drone behavior in `DroneControls.jsx`:

```javascript
// Battery drain rate
battery: Math.max(0, prev.battery - 0.1) // Drains 0.1% per second

// Movement speed
const moveInterval = setInterval(() => {
  // Drone movement logic
}, 3000) // Updates every 3 seconds
```

## 🎨 Customization

### Styling
The application uses a modern dark theme with cyan accents. You can customize colors in `App.css`:

```css
/* Primary accent color */
--primary-color: #00d4ff;

/* Background gradient */
background: linear-gradient(135deg, #0c1426 0%, #1a2332 100%);

/* Alert colors */
--illegal-color: #ff4444;
--thermal-color: #ff8800;
--movement-color: #ffcc00;
```

### Adding New Features
1. Create new components in the `src/components/` directory
2. Import and integrate them into `App.jsx`
3. Add corresponding styles to `App.css`
4. Update the navigation menu if needed

## 🚨 Emergency Protocols

### Return to Base
- Automatically navigates drone to base coordinates
- Reduces altitude and speed for safe landing
- Activates emergency protocols

### Emergency Landing
- Immediately reduces altitude to 0
- Stops all movement
- Activates emergency mode for 5 seconds

### Kill Switch
- Immediately deactivates drone
- Stops all systems
- Requires manual reactivation

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers (1920x1080 and above)
- Tablets (768px and above)
- Mobile devices (320px and above)

## 🔒 Security Features

### Simulated Security Measures
- Real-time threat detection
- Priority-based alert system
- Emergency response protocols
- Activity logging and tracking
- Geographic boundary monitoring

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The built files can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Firebase Hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenStreetMap for map data
- Three.js community for 3D graphics
- React community for the amazing framework
- Chart.js for data visualization

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This is a simulation system for educational and demonstration purposes. It does not control real drones or access real security systems.

## AI Detection Backend (YOLOv5 + FastAPI)

This project supports real-time detection of humans, landmines, and helicopters from the live camera using an AI backend. The backend uses YOLOv5 (or YOLOv8) and FastAPI.

### 1. Backend Setup

1. **Clone the YOLOv5 repo and install dependencies:**
   ```bash
   git clone https://github.com/ultralytics/yolov5.git
   cd yolov5
   pip install -r requirements.txt
   pip install fastapi uvicorn python-multipart
   ```
2. **Download a YOLOv5 model:**
   - For demo: `yolov5s.pt` (humans/vehicles only)
   - For landmine/helicopter: Use your own custom-trained model.

3. **Create `detect_api.py` in the YOLOv5 folder:**
   ```python
   from fastapi import FastAPI, File, UploadFile
   from fastapi.middleware.cors import CORSMiddleware
   from PIL import Image
   import io
   import torch
   import numpy as np

   app = FastAPI()
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

   # Load model (change path to your custom model if needed)
   model = torch.hub.load('ultralytics/yolov5', 'custom', path='your_custom_model.pt', force_reload=True)

   @app.post("/detect")
   async def detect(file: UploadFile = File(...)):
       image_bytes = await file.read()
       img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
       results = model(img)
       detections = []
       for *box, conf, cls in results.xyxy[0].tolist():
           label = model.names[int(cls)]
           detections.append({
               "label": label,
               "confidence": conf,
               "box": box  # [x1, y1, x2, y2]
           })
       return {"detections": detections}
   ```

4. **Run the backend:**
   ```bash
   uvicorn detect_api:app --host 0.0.0.0 --port 8000
   ```

### 2. Frontend Setup

- The React app will send frames to `http://localhost:8000/detect` and draw the returned boxes.
- Make sure the backend is running before starting the React app.

## Troubleshooting

### Detection Not Working?
- **Backend not running:** Make sure you started FastAPI with `uvicorn detect_api:app --host 0.0.0.0 --port 8000`.
- **No bounding boxes for helicopter/landmine:** You must use a YOLO model trained for these classes. The default YOLOv5s model only detects people, cars, etc.
- **Frontend can't reach backend:** Check browser console/network tab for errors. Make sure CORS is enabled in FastAPI and both are running on accessible ports.
- **Test backend directly:**
  ```bash
  curl -X POST "http://localhost:8000/detect" -F "file=@sample.jpg"
  ```
  You should get a JSON with detected objects.

## How to Train a Custom YOLO Model (for Helicopter/Landmine)

1. **Collect and label images** of helicopters and landmines (use Roboflow, CVAT, or LabelImg).
2. **Export dataset** in YOLO format.
3. **Train YOLOv5/YOLOv8:**
   ```bash
   git clone https://github.com/ultralytics/yolov5.git
   cd yolov5
   pip install -r requirements.txt
   python train.py --img 640 --batch 16 --epochs 50 --data data.yaml --weights yolov5s.pt
   ```
   - Replace `data.yaml` with your dataset config.
   - After training, use the best `.pt` model in the backend.

4. **Update backend to use your model:**
   - In `detect_api.py`, change the model path:
     ```python
     model = torch.hub.load('ultralytics/yolov5', 'custom', path='your_model.pt', force_reload=True)
     ```

## Example Backend: detect_api.py

```python
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import torch

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your custom YOLO model (update path as needed)
model = torch.hub.load('ultralytics/yolov5', 'custom', path='your_model.pt', force_reload=True)

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    image_bytes = await file.read()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model(img)
    detections = []
    for *box, conf, cls in results.xyxy[0].tolist():
        label = model.names[int(cls)]
        detections.append({
            "label": label,
            "confidence": conf,
            "box": box  # [x1, y1, x2, y2]
        })
    return {"detections": detections}
```
