# Video Encryption Microservice

This microservice provides secure video streaming utilities for drones, including AES-256 and SRTP (stub) encryption/decryption.

## Features
- REST API for:
  - Encrypting video chunks (`/encrypt-chunk`)
  - Decrypting video chunks (`/decrypt-chunk`)
- Modular: does not affect your main backend or UI

## Endpoints
- `GET /health` — Health check
- `POST /encrypt-chunk` — Encrypt a video chunk (AES-256, stub)
- `POST /decrypt-chunk` — Decrypt a video chunk (AES-256, stub)

## How to Run
```bash
cd backend/video_encryption
pip install fastapi uvicorn pydantic
python video_secure.py
```

## Integration
- Connect your backend or dashboard to this service for secure video streaming.
- Extend with real AES/SRTP encryption as needed. 

## Quick Integration Example

**Encrypt a video chunk (Node.js/JS):**
```js
fetch('http://localhost:5600/encrypt-chunk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'base64chunk', key: 'yourkey' })
})
  .then(res => res.json())
  .then(console.log);
``` 