const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// AI Detection Endpoint (placeholder logic)
app.post('/api/detect', upload.single('image'), (req, res) => {
  // In a real implementation, you would process req.file.path with your AI model or API
  // For now, return a placeholder response
  res.json({
    success: true,
    message: 'AI detection completed (placeholder)',
    filename: req.file ? req.file.originalname : null,
    detections: [
      { label: 'object', confidence: 0.95, box: [100, 100, 200, 200] }
    ]
  });
});

app.listen(port, () => {
  console.log(`AI Detection API server running at http://localhost:${port}`);
}); 