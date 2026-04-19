# filepath: backend/app/services/embedding_service.py
from typing import List
import logging
import httpx
import numpy as np
from app.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service to generate embeddings using Ollama (nomic-embed-text)"""
    
    def __init__(self):
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
        self.provider = settings.default_embedding_function
        
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings via Ollama API"""
        if not texts:
            return []
            
        try:
            embeddings = []
            with httpx.Client(timeout=60.0) as client:
                for text in texts:
                    response = client.post(
                        f"{self.base_url}/api/embeddings",
                        json={"model": self.model, "prompt": text}
                    )
                    
                    if response.status_code == 200:
                        embeddings.append(response.json()["embedding"])
                    else:
                        logger.error(f"Ollama embedding error: {response.text}")
                        # Return dummy embedding on error to avoid breaking things
                        embeddings.append([0.0] * self.get_embedding_dimension())
                        
            return embeddings
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            # Fallback to zeros
            return [[0.0] * self.get_embedding_dimension()] * len(texts)

    def get_embedding_dimension(self) -> int:
        """Standard dimension for nomic-embed-text is 768"""
        if "nomic" in self.model:
            return 768
        return 384  # Default for many small models

embedding_service = EmbeddingService()
