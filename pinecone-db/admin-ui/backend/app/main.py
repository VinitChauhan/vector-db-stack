# filepath: backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.clients.client_factory import pinecone_client
from app.routes import indexes, vectors, stats

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
    logger.info("Starting Pinecone Local Admin API...")
    pinecone_client.connect()
    logger.info(f"Connected to Pinecone Local at {settings.pinecone_host}")
    yield
    # Shutdown
    logger.info("Shutting down Pinecone Local Admin API...")


# Create FastAPI app
app = FastAPI(
    title="Pinecone Local Admin API",
    description="REST API for Pinecone Local emulator management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(indexes.router, prefix="/api/v1")
app.include_router(vectors.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Pinecone Local Admin API",
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
