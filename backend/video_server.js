const express = require('express');
const app = express();
const path = require('path');

app.use('/video', express.static(path.join(__dirname, 'public')));
 
app.listen(5001, () => {
  console.log('Video server running at http://localhost:5001/video/drone_video.mp4');
}); 