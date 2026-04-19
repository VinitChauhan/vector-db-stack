# filepath: backend/app/config.py
from pydantic_settings import BaseSettings
from typing import Optional, List, Union


class Settings(BaseSettings):
    """Application configuration"""
    
    # Pinecone settings
    pinecone_api_key: str = "pclocal"
    pinecone_host: str = "http://localhost:5080"
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8002
    log_level: str = "INFO"
    
    # CORS settings
    cors_origins: Union[List[str], str] = ["http://localhost:3001", "http://127.0.0.1:3001"]
    
    # Embedding settings (Ollama for internal RAG support)
    default_embedding_function: str = "ollama"
    ollama_base_url: str = "http://host.docker.internal:11434"
    ollama_model: str = "nomic-embed-text"
    ollama_chat_model: str = "llama3.2:1b"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if isinstance(self.cors_origins, str):
            self.cors_origins = [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
