# filepath: backend/app/routes/documents.py
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
import logging
import json
import time
from pathlib import Path

from app.clients.client_factory import chroma_client
from app.schemas.collection import (
    DocumentAdd, 
    DocumentAddResponse,
    DocumentQuery,
    QueryResult,
    DocumentDelete,
    DocumentDeleteResponse,
    ChatRequest,
    ChatResponse
)
from app.services.embedding_service import embedding_service
from app.services.hybrid_search_service import hybrid_search_service
from app.services.llm_service import llm_service
from app.services.document_parser import SUPPORTED_UPLOAD_TYPES, chunk_text, parse_document_bytes

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/{collection_name}", response_model=DocumentAddResponse)
async def add_documents(collection_name: str, documents: DocumentAdd):
    """Add documents to a collection"""
    try:
        coll = chroma_client.get_collection(collection_name)
        
        # Auto-generate embeddings if requested
        embeddings = documents.embeddings
        if documents.auto_embed and documents.documents:
            logger.info(f"Auto-generating embeddings for {len(documents.documents)} documents")
            embeddings = embedding_service.embed_texts(documents.documents)
        
        # Add documents
        coll.add(
            ids=documents.ids,
            embeddings=embeddings,
            metadatas=documents.metadatas,
            documents=documents.documents
        )
        
        return DocumentAddResponse(
            ids=documents.ids,
            added=len(documents.ids)
        )
    except Exception as e:
        logger.error(f"Failed to add documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{collection_name}/upload", response_model=DocumentAddResponse)
async def upload_documents(
    collection_name: str,
    files: list[UploadFile] = File(...),
    metadata_json: str | None = Form(default=None),
    auto_embed: bool = Form(default=True),
):
    """Upload local documents, extract text, chunk it, and add to a collection"""
    try:
        coll = chroma_client.get_collection(collection_name)
        base_metadata = _parse_upload_metadata(metadata_json)

        ids: list[str] = []
        docs: list[str] = []
        metadatas: list[dict] = []

        for file_index, upload in enumerate(files):
            if not upload.filename:
                continue

            extension = Path(upload.filename).suffix.lower()
            if extension not in SUPPORTED_UPLOAD_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Unsupported file type '{extension or 'unknown'}' for '{upload.filename}'. "
                        f"Supported types: {', '.join(sorted(SUPPORTED_UPLOAD_TYPES))}"
                    ),
                )

            content = await upload.read()
            extracted_text = parse_document_bytes(upload.filename, content)
            chunks = chunk_text(extracted_text)
            if not chunks:
                logger.warning("Skipping empty upload: %s", upload.filename)
                continue

            for chunk_index, chunk in enumerate(chunks):
                ids.append(f"upload-{int(time.time() * 1000)}-{file_index}-{chunk_index}")
                docs.append(chunk)
                metadata = dict(base_metadata)
                metadata.update(
                    {
                        "source_file": upload.filename,
                        "source_type": extension.lstrip(".") or "unknown",
                        "chunk_index": chunk_index,
                        "chunk_total": len(chunks),
                    }
                )
                metadatas.append(metadata)

        if not docs:
            raise HTTPException(status_code=400, detail="No readable content found in uploaded files")

        embeddings = None
        if auto_embed:
            logger.info("Auto-generating embeddings for %s uploaded document chunks", len(docs))
            embeddings = embedding_service.embed_texts(docs)

        coll.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas or None,
            documents=docs,
        )

        return DocumentAddResponse(ids=ids, added=len(ids))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{collection_name}/query", response_model=QueryResult)
async def query_documents(collection_name: str, query: DocumentQuery):
    """Query documents in a collection"""
    try:
        coll = chroma_client.get_collection(collection_name)
        
        # Map boolean flags to the 'include' list expected by ChromaDB
        include = []
        if query.include_metadatas:
            include.append("metadatas")
        if query.include_documents:
            include.append("documents")
        
        # Distances only valid for query()
        query_include = list(include)
        if query.include_distances:
            query_include.append("distances")
            
        # Retrieval Logic based on search_type
        if query.search_type == "keyword":
            # Keyword Search using where_document contains
            # Note: coll.get doesn't return distances
            query_text = query.query_text or ""
            keyword_results = coll.get(
                where_document={"$contains": query_text},
                limit=query.n_results,
                include=include if include else ["metadatas", "documents"]
            )
            results = {
                "ids": [keyword_results.get("ids", [])],
                "metadatas": [keyword_results.get("metadatas", [])],
                "documents": [keyword_results.get("documents", [])],
                "distances": [[None] * len(keyword_results.get("ids", []))]
            }
        elif query.search_type == "hybrid":
            # Hybrid Search: Combine Semantic and Keyword
            semantic_results = coll.query(
                query_embeddings=query.query_embeddings,
                n_results=query.n_results,
                where=query.where,
                where_document=query.where_document,
                include=query_include if query_include else ["metadatas", "documents", "distances"]
            )
            
            query_text = query.query_text or ""
            keyword_results = coll.get(
                where_document={"$contains": query_text},
                limit=query.n_results,
                include=include if include else ["metadatas", "documents"]
            )
            
            results = hybrid_search_service.reciprocal_rank_fusion(
                semantic_results, 
                keyword_results,
                k=60
            )
        else:
            # Default Semantic Search
            results = coll.query(
                query_embeddings=query.query_embeddings,
                n_results=query.n_results,
                where=query.where,
                where_document=query.where_document,
                include=query_include if query_include else ["metadatas", "documents", "distances"]
            )
        
        return QueryResult(
            ids=results.get("ids", []),
            distances=results.get("distances"),
            metadatas=results.get("metadatas"),
            documents=results.get("documents")
        )
    except Exception as e:
        logger.error(f"Failed to query documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{collection_name}/chat", response_model=ChatResponse)
async def chat_documents(collection_name: str, request: ChatRequest):
    """Chat with documents in a collection using hybrid search"""
    try:
        # 1. Get embedding for the query
        query_embeddings = embedding_service.embed_texts([request.query])
        
        # 2. Perform hybrid search to get context
        query_obj = DocumentQuery(
            query_embeddings=query_embeddings,
            query_text=request.query,
            n_results=request.n_results,
            search_type=request.search_type
        )
        
        search_results = await query_documents(collection_name, query_obj)
        
        # 3. Format context
        context_docs = []
        if search_results.documents and search_results.documents[0]:
            context_docs = search_results.documents[0]
        
        # 4. Generate Answer using local LLM
        answer = llm_service.generate_response(
            query=request.query,
            context_documents=context_docs,
            history=[{"role": m.role, "content": m.content} for m in request.history]
        )
        
        # 5. Extract sources
        sources = []
        if search_results.ids and search_results.ids[0]:
            for i, doc_id in enumerate(search_results.ids[0]):
                meta = search_results.metadatas[0][i] if search_results.metadatas else {}
                sources.append({
                    "id": doc_id,
                    "metadata": meta,
                    "snippet": context_docs[i][:100] + "..." if i < len(context_docs) else ""
                })

        return ChatResponse(
            answer=answer,
            sources=sources,
            search_results=search_results
        )
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{collection_name}", response_model=DocumentDeleteResponse)
async def delete_documents(collection_name: str, delete_req: DocumentDelete):
    """Delete documents from a collection"""
    try:
        coll = chroma_client.get_collection(collection_name)
        
        # Get count before deletion
        count_before = coll.count()
        
        # Delete based on filter
        coll.delete(
            ids=delete_req.ids,
            where=delete_req.where,
            where_document=delete_req.where_document
        )
        
        count_after = coll.count()
        deleted = count_before - count_after
        
        return DocumentDeleteResponse(deleted=deleted)
    except Exception as e:
        logger.error(f"Failed to delete documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{collection_name}")
async def get_documents(
    collection_name: str, 
    limit: int = 100, 
    offset: int = 0
):
    """Get documents from a collection (paginated)"""
    try:
        coll = chroma_client.get_collection(collection_name)
        
        # Peek doesn't support offset, so we get a larger sample
        data = coll.peek(limit=limit + offset)
        
        ids = data.get("ids", [])
        start = min(offset, len(ids))
        end = min(offset + limit, len(ids))
        
        return {
            "ids": ids[start:end],
            "metadatas": data.get("metadatas", [])[start:end] if data.get("metadatas") else [],
            "documents": data.get("documents", [])[start:end] if data.get("documents") else [],
            "total": len(ids),
            "offset": offset,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Failed to get documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _parse_upload_metadata(raw_metadata: str | None) -> dict:
    if not raw_metadata or not raw_metadata.strip():
        return {}

    try:
        parsed = json.loads(raw_metadata)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Metadata must be valid JSON") from exc

    if parsed is None:
        return {}
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=400, detail="Metadata must be a JSON object")
    return parsed
