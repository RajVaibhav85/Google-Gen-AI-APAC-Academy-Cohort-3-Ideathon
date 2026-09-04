"""
Python ML & RAG Microservice for Gemini AI & Vector Embeddings
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Gemini RAG & ML Microservice",
    description="Vector search, embeddings, and LangChain/Gemini orchestration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    user_id: Optional[str] = None

class RAGResponse(BaseModel):
    synthesis: str
    model: str
    tokens_used: int

@app.get("/")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Python ML & RAG Engine",
        "gemini_ready": bool(os.getenv("GEMINI_API_KEY"))
    }

@app.post("/api/rag/synthesize", response_model=RAGResponse)
def synthesize_reflection(req: PromptRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    # RAG synthesis logic stub
    return RAGResponse(
        synthesis=f"Structured RAG synthesis for: {req.prompt[:100]}...",
        model="gemini-3.6-flash",
        tokens_used=128
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
