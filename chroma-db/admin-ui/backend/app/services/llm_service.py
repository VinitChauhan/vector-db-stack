# filepath: backend/app/services/llm_service.py
from typing import List, Dict, Any, Optional
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Service for generating LLM responses using local Ollama model"""
    
    def __init__(self):
        # Normalize URL by removing trailing slash if present
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_chat_model
        
    def generate_response(
        self, 
        query: str, 
        context_documents: List[str], 
        history: List[Dict[str, str]] = []
    ) -> str:
        """
        Generate a response using the context and chat history.
        
        Args:
            query: The user's query
            context_documents: Retrieved document snippets
            history: Previous messages in the conversation
            
        Returns:
            The generated response string
        """
        # Prepare context string
        context_str = "\n\n".join([f"--- Document {i+1} ---\n{doc}" for i, doc in enumerate(context_documents)])
        
        # Build the system prompt
        system_prompt = (
            "You are a helpful AI assistant specialized in answering questions based on the provided document context. "
            "Use the following pieces of retrieved context to answer the user's question. "
            "If the context doesn't contain the answer, politely say you don't know based on the provided documents. "
            "Keep your responses concise and accurate.\n\n"
            f"RELEVANT CONTEXT:\n{context_str}"
        )
        
        # Prepare messages for Ollama API
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (excluding system prompt if already there, but we just built it)
        # History is expected to be a list of {"role": "user"|"assistant", "content": "..."}
        messages.extend(history)
        
        # Add current query
        messages.append({"role": "user", "content": query})
        
        try:
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False
                    }
                )
                
                if response.status_code != 200:
                    error_detail = response.text
                    try:
                        error_json = response.json()
                        if "error" in error_json:
                            error_detail = error_json["error"]
                    except:
                        pass
                    
                    logger.error(f"Ollama API error ({response.status_code}): {error_detail}")
                    return f"Ollama API Error ({response.status_code}): {error_detail}. Make sure the model '{self.model}' is pulled locally."

                data = response.json()
                
                if "message" in data and "content" in data["message"]:
                    return data["message"]["content"]
                else:
                    logger.error(f"Unexpected response from Ollama chat: {data}")
                    return "Sorry, I received an invalid response from the language model."
                    
        except Exception as e:
            logger.error(f"Ollama chat generation failed: {e}")
            return f"Error connecting to local LLM: {str(e)}"

llm_service = LLMService()
