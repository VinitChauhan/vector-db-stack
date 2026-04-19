# Pinecone Local Admin: Architectural Mandates

This document outlines the core architectural principles and technical mandates for the Pinecone Local Admin project.

## 1. Local-First AI Policy
The system MUST prioritize local execution for all AI operations.
- **Mandate**: No external API keys (OpenAI, Anthropic) should be required for core functionality.
- **Implementation**: All embeddings MUST be generated via the local Ollama instance (`nomic-embed-text`) unless explicitly overridden by the user.
- **Fallback**: If Ollama is unreachable, the system should gracefully degrade with descriptive error messages rather than failing silently.

## 2. Pinecone Local Connectivity
The system is optimized for the `pinecone-local` emulator.
- **Mandate**: All indexes MUST be created using the `ServerlessSpec` or compatible emulator specs.
- **Persistence**: Data MUST be persisted via volume mapping to `/Users/vinitchauhan/AI-Workspace/pinecone-db-data`.

## 3. Semantic Search Integrity
The UI and Backend MUST provide a "Natural Language" search interface.
- **Mandate**: Users should be able to query the vector database without providing raw vectors manually.
- **Backend Role**: The `vectors/query` endpoint MUST handle text-to-vector conversion transparently using the `EmbeddingService`.

## 4. UI/UX Standards
Aesthetics are as important as functionality.
- **Mandate**: Use "Premium Dark Mode" as the baseline theme.
- **Components**: Use `lucide-react` for iconography and `clsx` for dynamic styling.
- **Feedback**: Every asynchronous action (creation, deletion, search) MUST show a loading state (spinner/pulse) and provide instant feedback on success/failure.

## 5. Development Workflow
- **Backend First**: New features must be implemented in the FastAPI backend and verified via Swagger UI (`/docs`) before frontend integration.
- **Pydantic Validation**: All API requests and responses MUST be strictly typed using Pydantic models in `app/schemas/`.

---
*Failure to adhere to these mandates will result in architectural debt and is considered a project regression.*
