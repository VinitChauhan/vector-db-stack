# Vector DB Stack

Local vector database stack for development and testing, featuring premium administrative interfaces for both Pinecone and ChromaDB.

## Project Structure

```
vector-db-stack/
├── pinecone-db/
│   └── admin-ui/           # Next.js + FastAPI Admin Suite
├── chroma-db/
│   └── admin-ui/           # Next.js + FastAPI Admin Suite
└── README.md
```

## Services Summary

| Service | Port | Native API | Admin UI (Port) | Tech Stack |
|---------|------|------------|-----------------|------------|
| **Pinecone Local** | 5080 | http://localhost:5080 | [3001](http://localhost:3001) | Next.js + FastAPI |
| **ChromaDB** | 8000 | http://localhost:8000 | [3000](http://localhost:3000) | Next.js + FastAPI |

---

## Pinecone Local Stack

A high-performance emulation of Pinecone for local development, featuring a glassmorphic administrative interface.

### Features
- **Local Persistence**: Data is saved to `~/AI-Workspace/pinecone-db-data`.
- **Index Management**: Create, list, describe, and delete indexes visually.
- **Vector Explorer**: Advanced UI for upserting, fetching, and querying vectors.
- **RAG Integration**: Built-in support for Ollama (`nomic-embed-text`) to perform natural language semantic queries.

### Quick Start
```bash
cd pinecone-db/admin-ui
docker compose up --build -d
```
- **Admin UI**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:8002/api/v1](http://localhost:8002/api/v1)

---

## ChromaDB Stack

A robust setup for ChromaDB with a modern administrative suite for collection and document management.

### Features
- **Settings**: Configure HNSW parameters (space, ef_construction) and view metadata.
- **Data Upload**: Support for manual entry, JSON, and CSV uploads with column mapping.
- **Smart Search**: Similarity search with metadata/document filters.
- **Data Management**: Tabular view, CSV export, and bulk deletion.

### Quick Start
```bash
cd chroma-db/admin-ui
docker compose up --build -d
```
- **Admin UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8001/api/v1](http://localhost:8001/api/v1)

---

## 🛠 Prerequisites

- **Docker & Docker Compose**: Required to run the containers.
- **Ollama**: Recommended for local embedding generation.
  - Run `ollama pull nomic-embed-text` for the default embedding model.

## Python Client Example (Pinecone)

```python
from pinecone import Pinecone

pc = Pinecone(api_key="pclocal", host="http://localhost:5080")
index = pc.Index(name="my-index") # Ensure index exists first

index.upsert(vectors=[
    {"id": "v1", "values": [0.1, 0.2, ...], "metadata": {"tag": "test"}}
])
```

## Maintenance

```bash
# View all running services
docker compose ps

# Stop all services
docker compose down

# Rebuild if you make changes
docker compose up --build -d
```

## Limitations

- **Pinecone Local**: Uses an in-memory emulator internally, but this stack adds a volume mount for the emulator's data storage to improve persistence across restarts.
- **Development Only**: Designed for local development, testing, and RAG prototyping.