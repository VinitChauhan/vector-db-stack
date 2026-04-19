# filepath: backend/app/schemas/pinecone_schemas.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime


# Index schemas
class IndexCreate(BaseModel):
    """Request to create a new index"""
    name: str = Field(..., min_length=1, max_length=100)
    dimension: int = Field(..., gt=0)
    metric: Literal["cosine", "euclidean", "dotproduct"] = "cosine"


class IndexResponse(BaseModel):
    """Index information response"""
    name: str
    dimension: int
    metric: str
    host: str
    status: Dict[str, Any]
    vector_count: int = 0


class IndexListResponse(BaseModel):
    """List of indexes"""
    indexes: List[IndexResponse]
    total: int


# Vector schemas
class VectorUpsert(BaseModel):
    """Upsert vectors request"""
    ids: List[str]
    values: List[List[float]]
    metadatas: Optional[List[Dict[str, Any]]] = None
    namespace: Optional[str] = ""


class VectorUpsertResponse(BaseModel):
    """Response after upserting vectors"""
    upserted_count: int


class VectorQuery(BaseModel):
    """Query request"""
    vector: Optional[List[float]] = None
    query_text: Optional[str] = None  # Original text for auto-embedding
    top_k: int = 10
    namespace: Optional[str] = ""
    filter: Optional[Dict[str, Any]] = None
    include_metadata: bool = True
    include_values: bool = False


class QueryMatch(BaseModel):
    """A single match in query results"""
    id: str
    score: float
    values: Optional[List[float]] = None
    metadata: Optional[Dict[str, Any]] = None


class QueryResult(BaseModel):
    """Vector query results"""
    matches: List[QueryMatch]
    namespace: str


class VectorDelete(BaseModel):
    """Delete vectors request"""
    ids: Optional[List[str]] = None
    delete_all: bool = False
    namespace: Optional[str] = ""
    filter: Optional[Dict[str, Any]] = None


# Stats schemas
class StatsResponse(BaseModel):
    """Index statistics"""
    dimension: int
    index_fullness: float
    total_vector_count: int
    namespaces: Dict[str, Any]


# Health check
class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    pinecone: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
