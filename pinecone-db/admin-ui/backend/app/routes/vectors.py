# filepath: backend/app/routes/vectors.py
from fastapi import APIRouter, HTTPException, status
import logging
from typing import List, Optional

from app.clients.client_factory import pinecone_client
from app.schemas.pinecone_schemas import (
    VectorUpsert,
    VectorUpsertResponse,
    VectorQuery,
    QueryResult,
    QueryMatch,
    VectorDelete
)
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vectors", tags=["Vectors"])


@router.post("/{index_name}/upsert", response_model=VectorUpsertResponse)
async def upsert_vectors(index_name: str, request: VectorUpsert):
    """Upsert vectors into an index"""
    try:
        index = pinecone_client.get_index(index_name)
        
        vectors = []
        for i in range(len(request.ids)):
            vectors.append({
                "id": request.ids[i],
                "values": request.values[i],
                "metadata": request.metadatas[i] if request.metadatas else {}
            })
            
        result = index.upsert(vectors=vectors, namespace=request.namespace or None)
        return VectorUpsertResponse(upserted_count=result.get('upserted_count', 0))
    except Exception as e:
        logger.error(f"Failed to upsert vectors in {index_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{index_name}/query", response_model=QueryResult)
async def query_vectors(index_name: str, request: VectorQuery):
    """Query vectors in an index"""
    try:
        index = pinecone_client.get_index(index_name)
        
        query_vector = request.vector
        
        # Auto-embed if query_text is provided
        if request.query_text and not query_vector:
            logger.info(f"Auto-embedding query text: {request.query_text}")
            query_vector = embedding_service.embed_texts([request.query_text])[0]
            
        if not query_vector:
            raise HTTPException(status_code=400, detail="Either 'vector' or 'query_text' must be provided")

        results = index.query(
            vector=query_vector,
            top_k=request.top_k,
            namespace=request.namespace or None,
            filter=request.filter or None,
            include_metadata=request.include_metadata,
            include_values=request.include_values
        )
        
        matches = []
        for res in results.get('matches', []):
            matches.append(QueryMatch(
                id=res.get('id', ''),
                score=res.get('score', 0.0),
                values=res.get('values'),
                metadata=res.get('metadata')
            ))
            
        return QueryResult(
            matches=matches,
            namespace=results.get('namespace', '')
        )
    except Exception as e:
        logger.error(f"Query failed in {index_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{index_name}/{vector_id}")
async def fetch_vector(index_name: str, vector_id: str, namespace: Optional[str] = ""):
    """Fetch a specific vector by ID"""
    try:
        index = pinecone_client.get_index(index_name)
        fetch_results = index.fetch(ids=[vector_id], namespace=namespace or None)
        
        vectors = fetch_results.get('vectors', {})
        if vector_id not in vectors:
            raise HTTPException(status_code=404, detail=f"Vector '{vector_id}' not found")
            
        return vectors[vector_id]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fetch failed in {index_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{index_name}")
async def delete_vectors(index_name: str, request: VectorDelete):
    """Delete vectors from an index"""
    try:
        index = pinecone_client.get_index(index_name)
        index.delete(
            ids=request.ids,
            delete_all=request.delete_all,
            namespace=request.namespace or None,
            filter=request.filter or None
        )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Delete failed in {index_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
