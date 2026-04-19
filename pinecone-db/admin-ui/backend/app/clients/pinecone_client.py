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
        
    def connect(self, max_retries: int = 10, delay: int = 3):
        """Initialize high-level Pinecone client with retry logic"""
        import time
        for attempt in range(1, max_retries + 1):
            try:
                # For pinecone-local emulator, we pass the host
                self.pc = Pinecone(api_key=self.api_key, host=self.host)
                # Verify connection with a simple call
                self.pc.list_indexes()
                logger.info(f"Successfully connected to Pinecone at {self.host}")
                return self.pc
            except Exception as e:
                if attempt == max_retries:
                    logger.error(f"Failed to connect to Pinecone after {max_retries} attempts: {e}")
                    raise e
                logger.warning(f"Connection attempt {attempt}/{max_retries} failed: {e}. Retrying in {delay}s...")
                time.sleep(delay)

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
