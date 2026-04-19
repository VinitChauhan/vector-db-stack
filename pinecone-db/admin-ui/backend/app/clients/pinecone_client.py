# filepath: backend/app/clients/pinecone_client.py
from pinecone import Pinecone
import logging

logger = logging.getLogger(__name__)

class PineconeClient:
    """Wrapper for Pinecone interactions, specialized for local development"""
    
    def __init__(self, api_key: str, host: str):
        self.api_key = api_key
        self.host = host
        self.pc = None
        
    def connect(self):
        """Initialize high-level Pinecone client"""
        try:
            # For pinecone-local emulator, we pass the host
            self.pc = Pinecone(api_key=self.api_key, host=self.host)
            logger.info(f"Connected to Pinecone at {self.host}")
            return self.pc
        except Exception as e:
            logger.error(f"Failed to connect to Pinecone: {e}")
            raise e

    def list_indexes(self):
        return self.pc.list_indexes()

    def create_index(self, name: str, dimension: int, metric: str = "cosine"):
        from pinecone import ServerlessSpec
        return self.pc.create_index(
            name=name,
            dimension=dimension,
            metric=metric,
            spec=ServerlessSpec(cloud="aws", region="us-east-1") # Placeholder for emulator
        )

    def delete_index(self, name: str):
        return self.pc.delete_index(name)

    def describe_index(self, name: str):
        return self.pc.describe_index(name)

    def get_index(self, name: str):
        index_info = self.describe_index(name)
        return self.pc.Index(host=index_info.host)
