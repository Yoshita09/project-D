export async function analyzeImage({ file, lat, long, timestamp }) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('lat', lat);
  formData.append('lng', long);
  formData.append('timestamp', timestamp);

  const response = await fetch('http://localhost:5000/api/detect', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error('AI analysis failed');
  const result = await response.json();
  // Map YOLOv5 classes to military asset types
  const classMap = {
    person: 'soldier',
    airplane: 'aircraft',
    helicopter: 'helicopter',
    truck: 'military vehicle',
    car: 'military vehicle',
    tank: 'tank',
    missile: 'missile',
    radar: 'radar',
    landmine: 'landmine',
    // Add more mappings as needed
  };
  const detected_objects = (result.detections || []).map(obj => ({
    type: classMap[obj.name] || obj.name,
    confidence: obj.confidence || obj.score || obj.conf,
    bounding_box: [obj.xmin || obj.x1, obj.ymin || obj.y1, (obj.xmax || obj.x2) - (obj.xmin || obj.x1), (obj.ymax || obj.y2) - (obj.ymin || obj.y1)],
    threat_level: (obj.name === 'person' || obj.name === 'tank' || obj.name === 'missile') ? 'High' : 'Medium',
  }));
  return { detected_objects };
}

export async function describeImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('http://localhost:8000/describe', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Description failed');
  return await response.json();
} 