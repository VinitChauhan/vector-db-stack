# filepath: backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.clients.client_factory import chroma_client
from app.routes import collections, documents, stats

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("Starting ChromaDB Admin API...")
    chroma_client.connect()
    logger.info(f"Connected to ChromaDB at {settings.chroma_host}:{settings.chroma_port}")
    yield
    # Shutdown
    logger.info("Shutting down ChromaDB Admin API...")


# Create FastAPI app
app = FastAPI(
    title="ChromaDB Admin API",
    description="Production-ready REST API for ChromaDB vector database management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(collections.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "ChromaDB Admin API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/v1/embed-dimension")
async def get_embedding_dimension():
    """Get the embedding dimension for the configured provider"""
    from app.services.embedding_service import embedding_service
    return {
        "provider": embedding_service.provider,
        "dimension": embedding_service.get_embedding_dimension()
    }


@app.post("/api/v1/embed")
async def generate_embeddings(texts: list[str]):
    """Generate embeddings for texts"""
    from app.services.embedding_service import embedding_service
    embeddings = embedding_service.embed_texts(texts)
    return {"embeddings": embeddings}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )