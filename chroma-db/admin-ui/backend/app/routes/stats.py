# filepath: backend/app/routes/stats.py
from fastapi import APIRouter, HTTPException
import logging

from app.clients.client_factory import chroma_client
from app.schemas.collection import StatsResponse, HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("", response_model=StatsResponse)
async def get_stats():
    """Get database statistics"""
    try:
        collections = chroma_client.list_collections()
        total_documents = 0
        collection_details = []
        
        for name in collections:
            try:
                coll = chroma_client.get_collection(name)
                count = coll.count()
                total_documents += count
                collection_details.append({
                    "name": coll.name,
                    "count": count,
                    "metadata": coll.metadata
                })
            except Exception as e:
                logger.warning(f"Failed to get collection {name}: {e}")
        
        return StatsResponse(
            total_collections=len(collections),
            total_documents=total_documents,
            collections=collection_details,
            health={"status": "healthy"}
        )
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    chroma_health = chroma_client.health_check()
    
    return HealthResponse(
        status=chroma_health.get("status", "unhealthy"),
        chromadb=chroma_health
    )