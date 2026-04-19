# filepath: backend/app/routes/collections.py
from fastapi import APIRouter, HTTPException, status
from typing import List
import logging

from app.clients.client_factory import chroma_client
from app.schemas.collection import (
    CollectionCreate, 
    CollectionResponse, 
    CollectionListResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/collections", tags=["Collections"])


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(collection: CollectionCreate):
    """Create a new collection"""
    try:
        existing = chroma_client.list_collections()
        if collection.name in existing and not collection.get_or_create:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Collection '{collection.name}' already exists"
            )
        
        metadata = collection.metadata or None

        chroma_client.create_collection(
            name=collection.name,
            metadata=metadata,
            get_or_create=collection.get_or_create
        )
        
        coll = chroma_client.get_collection(collection.name)
        return CollectionResponse(
            name=coll.name,
            metadata=coll.metadata,
            count=coll.count()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=CollectionListResponse)
async def list_collections():
    """List all collections"""
    try:
        collections = chroma_client.list_collections()
        result = []
        
        for name in collections:
            try:
                coll = chroma_client.get_collection(name)
                result.append(CollectionResponse(
                    name=coll.name,
                    metadata=coll.metadata,
                    count=coll.count()
                ))
            except Exception as e:
                logger.warning(f"Failed to get collection {name}: {e}")
        
        return CollectionListResponse(
            collections=result,
            total=len(result)
        )
    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}", response_model=CollectionResponse)
async def get_collection(name: str):
    """Get a specific collection"""
    try:
        coll = chroma_client.get_collection(name)
        return CollectionResponse(
            name=coll.name,
            metadata=coll.metadata,
            count=coll.count()
        )
    except Exception as e:
        logger.error(f"Failed to get collection {name}: {e}")
        raise HTTPException(status_code=404, detail=f"Collection '{name}' not found")


@router.delete("/{name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(name: str):
    """Delete a collection"""
    try:
        chroma_client.delete_collection(name=name)
    except Exception as e:
        logger.error(f"Failed to delete collection {name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{name}/peek")
async def peek_collection(name: str, limit: int = 10):
    """Peek at collection data (preview)"""
    try:
        coll = chroma_client.get_collection(name)
        data = coll.peek(limit=limit)
        return {
            "ids": data.get("ids", []),
            "embeddings": data.get("embeddings", []),
            "metadatas": data.get("metadatas", []),
            "documents": data.get("documents", []),
            "count": len(data.get("ids", []))
        }
    except Exception as e:
        logger.error(f"Failed to peek collection {name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
