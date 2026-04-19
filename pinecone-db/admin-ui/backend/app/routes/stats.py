# filepath: backend/app/routes/stats.py
from fastapi import APIRouter, HTTPException
import logging
from datetime import datetime

from app.clients.client_factory import pinecone_client
from app.schemas.pinecone_schemas import StatsResponse, HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("", response_model=list[dict])
async def list_all_stats():
    """Get statistics for all indexes"""
    try:
        indexes_list = pinecone_client.list_indexes()
        result = []
        
        for idx in indexes_list.get('indexes', []):
            try:
                info = pinecone_client.describe_index(idx['name'])
                if info.status['ready']:
                    index_instance = pinecone_client.get_index(idx['name'])
                    stats = index_instance.describe_index_stats()
                    result.append({
                        "index_name": idx['name'],
                        "stats": stats
                    })
            except Exception as e:
                logger.warning(f"Could not get stats for {idx['name']}: {e}")
                
        return result
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{index_name}", response_model=StatsResponse)
async def get_index_stats(index_name: str):
    """Get stats for a specific index"""
    try:
        index = pinecone_client.get_index(index_name)
        stats = index.describe_index_stats()
        
        return StatsResponse(
            dimension=stats.get('dimension', 0),
            index_fullness=stats.get('index_fullness', 0.0),
            total_vector_count=stats.get('total_vector_count', 0),
            namespaces=stats.get('namespaces', {})
        )
    except Exception as e:
        logger.error(f"Failed to get stats for {index_name}: {e}")
        raise HTTPException(status_code=404, detail=f"Index '{index_name}' stats not available")


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Service health check"""
    try:
        # Check if we can reach the control plane
        pinecone_client.pc.list_indexes()
        return HealthResponse(
            status="ok",
            pinecone={"connected": True},
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        return HealthResponse(
            status="error",
            pinecone={"connected": False, "error": str(e)},
            timestamp=datetime.utcnow()
        )
