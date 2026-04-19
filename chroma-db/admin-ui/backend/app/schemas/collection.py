# filepath: backend/app/schemas/collection.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime


# Collection schemas
class CollectionCreate(BaseModel):
    """Request to create a new collection"""
    name: str = Field(..., min_length=1, max_length=100)
    metadata: Optional[Dict[str, Any]] = None
    get_or_create: bool = False


class CollectionResponse(BaseModel):
    """Collection response"""
    name: str
    metadata: Optional[Dict[str, Any]] = None
    count: int = 0


class CollectionListResponse(BaseModel):
    """List of collections"""
    collections: List[CollectionResponse]
    total: int


# Document schemas
class DocumentAdd(BaseModel):
    """Add documents request"""
    ids: List[str]
    embeddings: Optional[List[List[float]]] = None
    metadatas: Optional[List[Dict[str, Any]]] = None
    documents: Optional[List[str]] = None
    auto_embed: bool = False  # Auto-generate embeddings if not provided


class DocumentAddResponse(BaseModel):
    """Response after adding documents"""
    ids: List[str]
    added: int
    errors: Optional[List[str]] = None


class DocumentQuery(BaseModel):
    """Query request"""
    query_embeddings: List[List[float]]
    n_results: int = 10
    where: Optional[Dict[str, Any]] = None
    where_document: Optional[Dict[str, Any]] = None
    include_metadatas: bool = True
    include_documents: bool = True
    include_distances: bool = True
    search_type: Literal["semantic", "keyword", "hybrid"] = "semantic"
    query_text: Optional[str] = None  # Original text for keyword matching


class QueryResult(BaseModel):
    """Query result"""
    ids: List[List[str]]
    distances: Optional[List[List[float]]] = None
    metadatas: Optional[List[List[Dict]]] = None
    documents: Optional[List[List[str]]] = None


class ChatMessage(BaseModel):
    """Refers to a single message in a conversation"""
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """Request for document chat"""
    query: str
    n_results: int = 5
    search_type: Literal["semantic", "keyword", "hybrid"] = "hybrid"
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    """Response for document chat"""
    answer: str
    sources: List[Dict[str, Any]]
    search_results: QueryResult


class DocumentDelete(BaseModel):
    """Delete documents request"""
    ids: Optional[List[str]] = None
    where: Optional[Dict[str, Any]] = None
    where_document: Optional[Dict[str, Any]] = None


class DocumentDeleteResponse(BaseModel):
    """Delete response"""
    deleted: int


# Stats schemas
class StatsResponse(BaseModel):
    """Database statistics"""
    total_collections: int
    total_documents: int
    collections: List[Dict[str, Any]]
    health: Dict[str, Any]


# Health check
class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    chromadb: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)