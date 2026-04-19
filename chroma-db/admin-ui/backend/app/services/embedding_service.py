# filepath: backend/app/services/embedding_service.py
from typing import List, Optional, Dict, Any
import logging
import hashlib
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using various providers"""
    
    def __init__(self, provider: Optional[str] = None):
        self.provider = provider or settings.default_embedding_function
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        # Use simple mapping for dimensions, could be made more dynamic by calling Ollama /api/show
        self._dimensions = {
            "nomic-embed-text": 768,
            "all-minilm": 384,
            "mxbai-embed-large": 1024,
            "hash": 384
        }
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        if not texts:
            return []
            
        try:
            if self.provider == "ollama":
                return self._ollama_embeddings(texts)
            elif self.provider == "hash":
                return self._hash_embeddings(texts)
            else:
                # Default to hash if unknown
                logger.warning(f"Unknown provider '{self.provider}', falling back to hash")
                return self._hash_embeddings(texts)
        except Exception as e:
            logger.error(f"Embedding generation failed with {self.provider}: {e}")
            return self._fallback_embeddings(texts)
    
    def _ollama_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Ollama local API"""
        embeddings = []
        
        with httpx.Client(timeout=60.0) as client:
            for text in texts:
                response = client.post(
                    f"{self.base_url}/api/embeddings",
                    json={
                        "model": self.model,
                        "prompt": text
                    }
                )
                response.raise_for_status()
                data = response.json()
                if "embedding" in data:
                    embeddings.append(data["embedding"])
                else:
                    raise ValueError(f"Unexpected response from Ollama: {data}")
        
        return embeddings

    def _hash_embeddings(self, texts: List[str], dim: int = 384) -> List[List[float]]:
        """Generate deterministic embeddings based on text hash"""
        embeddings = []
        for text in texts:
            # Create a deterministic hash-based embedding
            hash_bytes = hashlib.sha256(text.encode()).digest()
            # Convert hash to float values
            values = []
            for i in range(dim):
                idx = i % len(hash_bytes)
                val = (hash_bytes[idx] / 255.0) * 2 - 1  # Normalize to [-1, 1]
                values.append(val)
            embeddings.append(values)
        return embeddings
    
    def _fallback_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Fallback: generate random embeddings (only for absolute emergencies)"""
        import numpy as np
        dim = self.get_embedding_dimension()
        np.random.seed(42)
        return [np.random.randn(dim).tolist() for _ in texts]
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings for the current provider"""
        if self.provider == "ollama":
            return self._dimensions.get(self.model, 768)
        return self._dimensions.get(self.provider, 384)


# Global embedding service
embedding_service = EmbeddingService()