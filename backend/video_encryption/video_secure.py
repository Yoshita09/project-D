# video_encryption/video_secure.py
# Microservice for secure video streaming (AES-256, SRTP stub)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoChunk(BaseModel):
    data: str  # base64-encoded video chunk
    key: Optional[str] = None  # AES key (stub)

@app.get("/health")
def health():
    return {"status": "ok", "service": "video_encryption"}

@app.post("/encrypt-chunk")
def encrypt_chunk(chunk: VideoChunk):
    # Stub: return "encrypted" data
    return {"encrypted": f"ENCRYPTED({chunk.data[:10]}...)"}

@app.post("/decrypt-chunk")
def decrypt_chunk(chunk: VideoChunk):
    # Stub: return "decrypted" data
    return {"decrypted": f"DECRYPTED({chunk.data[:10]}...)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5600) 