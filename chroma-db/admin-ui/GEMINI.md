# ChromaDB Admin & RAG UI Context & Mandates

This document provides foundational mandates and architectural context for the ChromaDB Admin UI project. These instructions take absolute precedence over general defaults.

## Project Overview
A production-ready administrative interface and RAG workstation for ChromaDB, featuring collection management, smart document indexing (PDF, DOCX, etc.), hybrid search (Keyword + Semantic), and conversational RAG using local LLMs.

## Architecture & Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Axios, Lucide React, Framer Motion.
- **Backend**: FastAPI (Python 3.11), Pydantic v2, ChromaDB Python SDK.
- **Data Layer**: ChromaDB (pinned to version `0.5.23`).
- **AI Infrastructure**: **Ollama** (hosting `llama3.2:1b` for chat and `nomic-embed-text` for embeddings).
- **Orchestration**: Docker Compose.

## Core Mandates

### Backend Engineering (Python/FastAPI)
- **Directory Structure**:
  - `app/routes/`: REST API endpoints grouped by resource (collections, documents, stats).
  - `app/schemas/`: Pydantic models for request validation and response serialization.
  - `app/services/`: Core logic including `document_parser.py`, `embedding_service.py`, `hybrid_search_service.py` (RRF), and `llm_service.py` (Ollama chat).
  - `app/clients/`: Connectivity logic for external systems like ChromaDB.
- **Conventions**:
  - Use `/api/v1` prefix for all API routes.
  - Implement robust error handling using FastAPI `HTTPException` with descriptive error messages.
  - Always utilize the `chroma_client` factory for ChromaDB interactions.
  - **Local-First AI**: All AI operations (embeddings and chat) MUST prioritize local providers (Ollama) unless explicitly overridden by configuration.
  - **RAG Integrity**: Context retrieved from ChromaDB must be formatted clearly for the LLM with appropriate source snippets.

### Frontend Engineering (Next.js/TypeScript)
- **Directory Structure**:
  - `src/app/`: Next.js App Router and main entry points.
  - `src/components/`: Modular UI components (Collections, Documents, Search, Settings, Chat).
  - `src/lib/`: Shared utilities and the Axios-based API client (`api.ts`).
- **Styling**: 
  - Exclusively use Tailwind CSS for all visual styling. 
  - Maintain a premium "admin" aesthetic with consistent spacing, typography, and interactive micro-animations.
- **API Interactions**: 
  - All backend communication MUST go through `src/lib/api.ts`.
- **Component Design**: 
  - Prefer functional components with hooks. 
  - Use Lucide React for icons.

### Infrastructure & Operations
- **Compatibility**: The project depends on ChromaDB server version `0.5.23`.
- **Persistence**: ChromaDB data is persisted in `/Users/vinitchauhan/AI-Workspace/chroma-db-data`. Ensure this path is reachable and writable.
- **Ollama**: Ensure Ollama is running on the host machine and has the required models (`llama3.2:1b`, `nomic-embed-text`) pulled before starting the stack.

## Security & Integrity
- **Sensitive Data**: Never commit `.env` files or any local SQLite/ChromaDB data directories.
- **API Keys**: Mask OpenAI or other sensitive provider keys in logs or UI displays.
- **Prompt Safety**: Ensure system prompts in `llm_service.py` are strictly defined to prevent hallucinations outside provided context.

## Testing & Validation
- **Backend**: Validate logic with unit tests for services, particularly the document parsers and hybrid search RRF logic.
- **Frontend**: Ensure type safety across all components and API interactions.
- **RAG Validation**: Regularly verify that the chat interface correctly attributes sources and respects the provided document context.
