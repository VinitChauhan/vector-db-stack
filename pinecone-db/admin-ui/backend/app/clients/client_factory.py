# filepath: backend/app/clients/client_factory.py
from app.clients.pinecone_client import PineconeClient
from app.config import settings

# Global client instance
pinecone_client = PineconeClient(
    api_key=settings.pinecone_api_key,
    host=settings.pinecone_host
)
