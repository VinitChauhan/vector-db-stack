# filepath: backend/app/routes/indexes.py
from fastapi import APIRouter, HTTPException, status
import logging

from app.clients.client_factory import pinecone_client
from app.schemas.pinecone_schemas import (
    IndexCreate, 
    IndexResponse, 
    IndexListResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/indexes", tags=["Indexes"])


@router.post("", response_model=IndexResponse, status_code=status.HTTP_201_CREATED)
async def create_index(index: IndexCreate):
    """Create a new index"""
    try:
        pinecone_client.create_index(
            name=index.name,
            dimension=index.dimension,
            metric=index.metric
        )
        
        info = pinecone_client.describe_index(index.name)
        return IndexResponse(
            name=info.name,
            dimension=info.dimension,
            metric=info.metric,
            host=info.host,
            status=info.status,
            vector_count=0
        )
    except Exception as e:
        logger.error(f"Failed to create index: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=IndexListResponse)
async def list_indexes():
    """List all indexes"""
    try:
        indexes_list = pinecone_client.list_indexes()
        result = []
        
        for idx in indexes_list.get('indexes', []):
            try:
                info = pinecone_client.describe_index(idx['name'])
                # Try to get count if index is ready
                count = 0
                if info.status['ready']:
                    try:
                        index_instance = pinecone_client.get_index(idx['name'])
                        stats = index_instance.describe_index_stats()
                        count = stats.get('total_vector_count', 0)
                    except:
                        pass
                
                result.append(IndexResponse(
                    name=info.name,
                    dimension=info.dimension,
                    metric=info.metric,
                    host=info.host,
                    status=info.status,
                    vector_count=count
                ))
            except Exception as e:
                logger.warning(f"Failed to get info for index {idx['name']}: {e}")
        
        return IndexListResponse(
            indexes=result,
            total=len(result)
        )
    except Exception as e:
        logger.error(f"Failed to list indexes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}", response_model=IndexResponse)
async def get_index(name: str):
    """Get a specific index"""
    try:
        info = pinecone_client.describe_index(name)
        count = 0
        if info.status['ready']:
            try:
                index_instance = pinecone_client.get_index(name)
                stats = index_instance.describe_index_stats()
                count = stats.get('total_vector_count', 0)
            except:
                pass
                
        return IndexResponse(
            name=info.name,
            dimension=info.dimension,
            metric=info.metric,
            host=info.host,
            status=info.status,
            vector_count=count
        )
    except Exception as e:
        logger.error(f"Failed to get index {name}: {e}")
        raise HTTPException(status_code=404, detail=f"Index '{name}' not found")


@router.delete("/{name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(name: str):
    """Delete an index"""
    try:
        pinecone_client.delete_index(name=name)
    except Exception as e:
        logger.error(f"Failed to delete index {name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
