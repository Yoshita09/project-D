# Security Layer Microservice

This microservice provides encryption, authentication, and digital signature utilities for secure drone communication.

## Features
- REST API for:
  - JWT token generation and verification
  - AES-256 encryption/decryption
  - Digital signature creation/verification
  - Key rotation (stub)
- Modular: does not affect your main backend or UI

## Endpoints (examples)
- `POST /jwt/generate` — Generate a JWT token
- `POST /jwt/verify` — Verify a JWT token
- `POST /aes/encrypt` — Encrypt data with AES-256
- `POST /aes/decrypt` — Decrypt data with AES-256
- `POST /sign` — Create a digital signature
- `POST /verify-signature` — Verify a digital signature
- `POST /rotate-key` — Rotate encryption keys (stub)

## Quick Integration Example

**Generate JWT (Node.js/JS):**
```js
fetch('http://localhost:5400/jwt/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user: 'operator' })
})
  .then(res => res.json())
  .then(console.log);
```

**Encrypt data (Node.js/JS):**
```js
fetch('http://localhost:5400/aes/encrypt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'secret', key: 'yourkey' })
})
  .then(res => res.json())
  .then(console.log);
```

## How to Run
```bash
cd backend/security_layer
pip install fastapi uvicorn pyjwt cryptography
python security.py
```

## Integration
- Connect your backend or dashboard to this service for secure communication and authentication.
- Extend with real key management and rotation as needed. 