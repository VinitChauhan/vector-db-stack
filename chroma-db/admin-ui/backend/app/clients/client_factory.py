# filepath: backend/app/clients/client_factory.py
from app.clients.chroma_client import ChromaClient
from app.config import settings

# Global client instance - initialized with settings
chroma_client = ChromaClient(
    host=settings.chroma_host,
    port=settings.chroma_port,
    ssl=settings.chroma_ssl
)