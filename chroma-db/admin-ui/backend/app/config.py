# filepath: backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional, List, Union


class Settings(BaseSettings):
    """Application configuration"""
    
    # ChromaDB settings
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    chroma_ssl: bool = False
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8001
    log_level: str = "INFO"
    
    # CORS settings - handle both list and string formats
    cors_origins: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Security (for future RBAC)
    secret_key: str = "dev-secret-key-change-in-production"
    api_keys: list[str] = []  # Multi-key support
    
    # Embedding settings
    default_embedding_function: str = "ollama"
    openai_api_key: Optional[str] = None
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "nomic-embed-text"
    ollama_chat_model: str = "llama3.2:1b"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Convert string to list if needed
        if isinstance(self.cors_origins, str):
            self.cors_origins = [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()