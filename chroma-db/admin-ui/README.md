# ChromaDB Admin & RAG UI

A feature-rich, production-ready admin interface and RAG (Retrieval-Augmented Generation) workstation for ChromaDB. Built with **FastAPI** and **Next.js**, it allows you to manage collections, index diverse document types, and chat with your data using local LLMs.

## 🚀 Key Features

- **Document Chat (RAG)**: Conversational interface to query your documents using local LLMs via Ollama.
- **Hybrid Search**: Advanced retrieval combining semantic vector search with keyword-based matching using Reciprocal Rank Fusion (RRF).
- **Collections Management**: Full CRUD operations for ChromaDB collections with metadata support.
- **Smart Document Indexing**: 
  - support for `pdf`, `docx`, `txt`, `md`, `csv`, `json`, and `html`.
  - Automatic text chunking and metadata extraction.
  - Progress tracking for large uploads.
- **Local AI stack**: Fully integrated with **Ollama** for private, local embeddings and chat generation.
- **Data Persistence**: Configured Docker volumes to ensure your vector data persists across container restarts.
- **Statistics Dashboard**: Real-time insights into database health and collection metrics.

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌────────────────┐
│   Frontend  │     │   Backend   │     │    External    │
│  (Next.js)  │────▶│  (FastAPI)  │────▶│    Services    │
│   :3000     │     │   :8001     │     └──────┬─────────┘
└─────────────┘     └─────────────┘            │
                           │           ┌───────┴────────┐
                           │           │    ChromaDB    │
                           └──────────▶│    (Vector)    │
                                       │     :8000      │
                                       └───────┬────────┘
                                               │
                                       ┌───────┴────────┐
                                       │     Ollama     │
                                       │    (LLM/Emb)   │
                                       │     :11434     │
                                       └────────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript, Framer Motion
- **Backend**: FastAPI (Python 3.11), Pydantic V2, ChromaDB SDK
- **Vector DB**: ChromaDB (`0.5.23`)
- **AI/ML**: 
  - **Ollama**: Hosting `llama3.2:1b` (Chat) and `nomic-embed-text` (Embeddings)
  - **Fallback**: sentence-transformers (local CPU embeddings)
- **Deployment**: Docker, Docker Compose

## 🚦 Quick Start

### 1. Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Ollama](https://ollama.com/) (running on host)
- Pull necessary models:
  ```bash
  ollama pull llama3.2:1b
  ollama pull nomic-embed-text
  ```

### 2. Launching the Stack

```bash
cd admin-ui
docker-compose up --build
```

Access the application:
- **UI**: [http://localhost:3000](http://localhost:3000)
- **API Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)

### 3. Data Persistence

By default, data is persisted to:
`/Users/vinitchauhan/AI-Workspace/chroma-db-data`

You can change this in `docker-compose.yaml` under the `chromadb` service volumes.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| **Collections** | | |
| GET | `/api/v1/collections` | List all collections |
| POST | `/api/v1/collections` | Create a collection |
| DELETE | `/api/v1/collections/{name}` | Delete a collection |
| **Documents** | | |
| POST | `/api/v1/documents/{collection}/upload` | Upload & index files (PDF, DOCX, etc.) |
| POST | `/api/v1/documents/{collection}/query` | Hybrid/Semantic query |
| POST | `/api/v1/documents/{collection}/chat` | **Conversational RAG** |
| GET | `/api/v1/documents/{collection}` | List browser documents |
| **System** | | |
| GET | `/api/v1/stats` | DB Statistics & Health |
| GET | `/api/v1/embed-dimension` | Current embedding config |

## ⚙️ Environment Variables (Backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `CHROMA_HOST` | `chromadb` | ChromaDB service name/host |
| `DEFAULT_EMBEDDING_FUNCTION` | `ollama` | Provider (`ollama` or `huggingface`) |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | URL to Ollama API |
| `OLLAMA_CHAT_MODEL` | `llama3.2:1b` | Model used for RAG chat |
| `OLLAMA_MODEL` | `nomic-embed-text` | Model used for embeddings |

---
*Maintained as part of the Vector DB Stack collection.*
