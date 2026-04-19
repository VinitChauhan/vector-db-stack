# Pinecone Local Admin UI

A professional, full-stack administrative interface for local Pinecone development and testing. This UI provides a powerful way to manage indexes, explore vector data, and test semantic search capabilities using local embedding models.

## ✨ Features

- **Index Management**: Create, list, describe, and delete Pinecone indexes.
- **Vector Explorer**: Query and upsert vectors with metadata support.
- **Semantic Search**: Integrated with **Ollama** (`nomic-embed-text`) to allow natural language queries against your vector data.
- **Namespace Support**: Full support for Pinecone namespaces.
- **Local Persistence**: Designed to work with the `pinecone-local` emulator and persistent storage volumes.
- **Premium Design**: Ultra-responsive, glassmorphic UI built with Next.js 14 and Tailwind CSS.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: FastAPI (Python 3.11), Pinecone-client, Pydantic.
- **AI/Embeddings**: Ollama (Local LLM/Embedding runtime).
- **Orchestration**: Docker & Docker Compose.

## 🛠️ Getting Started

### Prerequisites

- Docker and Docker Compose
- Ollama running locally (for embedding support)
  ```bash
  ollama pull nomic-embed-text
  ```

### Configuration

The backend and frontend can be configured via environment variables in the `docker-compose.yaml`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PINECONE_HOST` | URL of the Pinecone emulator | `http://pinecone-local:5080` |
| `OLLAMA_BASE_URL` | URL of the local Ollama service | `http://host.docker.internal:11434` |
| `NEXT_PUBLIC_API_URL`| Frontend API endpoint | `http://localhost:8002/api/v1` |

### Running the Stack

1. Navigate to the project directory:
   ```bash
   cd pinecone-db/admin-ui
   ```

2. Start the multi-container stack:
   ```bash
   docker compose up -d
   ```

3. Access the interfaces:
   - **Frontend**: [http://localhost:3001](http://localhost:3001)
   - **Backend API Docs**: [http://localhost:8002/docs](http://localhost:8002/docs)
   - **Pinecone Emulator**: [http://localhost:5080](http://localhost:5080)

## 📁 Persistence

The stack is configured to persist Pinecone data to the local workspace:
- **Host Path**: `/Users/vinitchauhan/AI-Workspace/pinecone-db-data`
- **Container Path**: `/data` (Mapped in `pinecone-local`)

---
*Created for local-first AI development workflows.*
