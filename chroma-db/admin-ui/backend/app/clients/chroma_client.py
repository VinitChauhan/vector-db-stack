# filepath: backend/app/clients/chroma_client.py
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class ChromaClient:
    """ChromaDB client wrapper with error handling"""
    
    def __init__(self, host: str = "localhost", port: int = 8000, ssl: bool = False):
        self.host = host
        self.port = port
        self.ssl = ssl
        self._client: Optional[chromadb.HttpClient] = None
    
    def connect(self) -> chromadb.HttpClient:
        """Connect to ChromaDB"""
        if self._client is None:
            # Create client with settings to avoid early validation
            settings = ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
            self._client = chromadb.HttpClient(
                host=self.host,
                port=self.port,
                ssl=self.ssl,
                settings=settings
            )
            logger.info(f"Connected to ChromaDB at {self.host}:{self.port}")
        return self._client
    
    @property
    def client(self) -> chromadb.HttpClient:
        """Get client instance"""
        if self._client is None:
            return self.connect()
        return self._client
    
    def list_collections(self) -> List[str]:
        """List all collection names"""
        collections = self.client.list_collections()
        return [c.name for c in collections]
    
    def get_collection(self, name: str):
        """Get collection by name"""
        return self.client.get_collection(name=name)
    
    def create_collection(
        self, 
        name: str, 
        metadata: Optional[Dict] = None,
        get_or_create: bool = False
    ):
        """Create a new collection"""
        return self.client.create_collection(
            name=name,
            metadata=metadata,
            get_or_create=get_or_create
        )
    
    def delete_collection(self, name: str):
        """Delete a collection"""
        self.client.delete_collection(name=name)
    
    def health_check(self) -> Dict[str, Any]:
        """Check ChromaDB health"""
        try:
            heartbeat = self.client.heartbeat()
            return {
                "status": "healthy",
                "heartbeat": heartbeat,
                "host": self.host,
                "port": self.port
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }


# Global client instance
chroma_client = ChromaClient()