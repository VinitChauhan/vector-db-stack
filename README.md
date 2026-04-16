# Vector DB Stack

Local vector database stack for development and testing.

## Project Structure

```
vector-db-stack/
├── pinecone-db/          # Pinecone Local + Admin UI
│   ├── Dockerfile
│   ├── docker-compose.yaml
│   └── pinecone_admin_ui.py
├── chroma-db/            # ChromaDB + Admin UI
│   ├── Dockerfile
│   ├── docker-compose.yaml
│   └── chroma_admin_ui.py
└── README.md
```

## Services

### Pinecone Local

In-memory Pinecone emulator for local development.

| Service | Port | Image |
|---------|------|-------|
| Pinecone Local | 5080 | `ghcr.io/pinecone-io/pinecone-local:latest` |
| Admin UI | 8501 | Streamlit |

**Port range:** 5080-5090 (indexes use ports 5081+)

### ChromaDB

Open-source vector database for embeddings.

| Service | Port | Image |
|---------|------|-------|
| ChromaDB | 8000 | `chromadb/chroma:latest` |
| Admin UI | 8502 | Streamlit |

**Data directory:** `./chroma-data` (persists on host)

## Quick Start

### Pinecone Local (with Admin UI)

```bash
cd pinecone-db
docker compose up -d
```

- **API:** http://localhost:5080
- **Admin UI:** http://localhost:8501

### ChromaDB (with Admin UI)

```bash
cd chroma-db
docker compose up -d
```

- **API:** http://localhost:8000
- **Admin UI:** http://localhost:8502

### Common Commands

```bash
# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Configuration

### Pinecone Local (Database Emulator)

```yaml
services:
  pinecone-local:
    image: ghcr.io/pinecone-io/pinecone-local:latest
    environment:
      PORT: 5080
      PINECONE_HOST: localhost
    ports:
      - "5080-5090:5080-5090"
    platform: linux/amd64
```

## Python Client Example

```python
from pinecone import Pinecone, ServerlessSpec

# Connect to Pinecone Local
pc = Pinecone(
    api_key="pclocal",  # any value works
    host="http://localhost:5080"
)

# Create two indexes, one dense and one sparse
dense_index_name = "dense-index"
sparse_index_name = "sparse-index"

if not pc.has_index(dense_index_name):
    dense_index_model = pc.create_index(
        name=dense_index_name,
        vector_type="dense",
        dimension=2,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        deletion_protection="disabled",
        tags={"environment": "development"}
    )
    print("Dense index created:", dense_index_model)

if not pc.has_index(sparse_index_name):
    sparse_index_model = pc.create_index(
        name=sparse_index_name,
        vector_type="sparse",
        metric="dotproduct",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        deletion_protection="disabled",
        tags={"environment": "development"}
    )
    print("Sparse index created:", sparse_index_model)

# Target each index
dense_index_host = pc.describe_index(name=dense_index_name).host
dense_index = pc.Index(host=dense_index_host)
sparse_index_host = pc.describe_index(name=sparse_index_name).host
sparse_index = pc.Index(host=sparse_index_host)

# Upsert records into the dense index
dense_index.upsert(
    vectors=[
        {"id": "vec1", "values": [1.0, -2.5], "metadata": {"genre": "drama"}},
        {"id": "vec2", "values": [3.0, -2.0], "metadata": {"genre": "documentary"}},
        {"id": "vec3", "values": [0.5, -1.5], "metadata": {"genre": "documentary"}}
    ],
    namespace="example-namespace"
)

# Upsert records into the sparse index
sparse_index.upsert(
    namespace="example-namespace",
    vectors=[
        {
            "id": "vec1",
            "sparse_values": {
                "values": [1.79, 0.41, 2.82, 2.80, 2.86, 1.65, 5.36, 1.30],
                "indices": [822745112, 1009084850, 1221765879, 1408993850, 1504846510, 1596856843, 1640781426, 1656251611]
            },
            "metadata": {"chunk_text": "Sample text 1", "category": "tech", "quarter": "Q3"}
        },
        {
            "id": "vec2",
            "sparse_values": {
                "values": [0.43, 3.34, 2.77, 3.02, 3.31, 5.60, 2.48, 0.38],
                "indices": [131900689, 592326839, 710158994, 838729363, 1304885087, 1640781426, 1690623792, 1807131503]
            },
            "metadata": {"chunk_text": "Sample text 2", "category": "tech", "quarter": "Q4"}
        }
    ]
)

# Check the number of records in each index
print("\nDense index stats:", dense_index.describe_index_stats())
print("Sparse index stats:", sparse_index.describe_index_stats())

# Query the dense index with a metadata filter
dense_response = dense_index.query(
    namespace="example-namespace",
    vector=[3.0, -2.0],
    filter={"genre": {"$eq": "documentary"}},
    top_k=1,
    include_values=False,
    include_metadata=True
)
print("\nDense query response:", dense_response)

# Query the sparse index with a metadata filter
sparse_response = sparse_index.query(
    namespace="example-namespace",
    sparse_vector={
        "values": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
        "indices": [767227209, 1640781426, 1690623792, 2021799277, 2152645940, 2295025838, 2443437770, 2779594451]
    },
    filter={"quarter": {"$eq": "Q4"}},
    top_k=1,
    include_values=False,
    include_metadata=True
)
print("Sparse query response:", sparse_response)

# Delete the indexes when done
pc.delete_index(name=dense_index_name)
pc.delete_index(name=sparse_index_name)
```

## ChromaDB Client Example

```python
import chromadb

# Connect to ChromaDB running in Docker
chroma_client = chromadb.HttpClient(host='localhost', port=8000)

# Verify connection
chroma_client.heartbeat()

# Create a collection
collection = chroma_client.create_collection(name="my-collection")

# Add embeddings
collection.add(
    ids=["id1", "id2", "id3"],
    embeddings=[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0], [7.0, 8.0, 9.0]],
    metadatas=[{"source": "doc1"}, {"source": "doc2"}, {"source": "doc3"}],
    documents=["Document 1 text", "Document 2 text", "Document 3 text"]
)

# Query the collection
results = collection.query(
    query_embeddings=[[1.0, 2.0, 3.0]],
    n_results=2
)

print(results)
```

## Limitations

### Pinecone Local

- **In-memory only** — Data does not persist after container stops
- **API version** — Uses `2025-01` (not latest stable)
- **No authentication** — API keys are ignored
- **Max records** — 100,000 per index
- **Not for production**

### ChromaDB

- **Single node** — Default config is single-node only
- **Development use** — Not recommended for high-scale production

## Moving to Production

1. Update client to use your Pinecone API key
2. Target your cloud indexes (e.g., `https://index-name-xxx.svc.us-east-1-aws.pinecone.io`)
3. Use [import feature](https://docs.pinecone.io/guides/index-data/import-data) for large datasets

## Resources

- [Pinecone Local Docs](https://docs.pinecone.io/guides/operations/local-development)
- [Pinecone Python SDK](https://docs.pinecone.io/reference/sdks/python/overview)

## Admin UI

### Pinecone Local (Streamlit)

A web-based admin UI for managing Pinecone Local indexes:

#### Run with Docker
```bash
cd pinecone-db
docker compose up --build -d
```
Then open [http://localhost:8501](http://localhost:8501)

**Features:**
- List, create, and delete indexes
- View index stats and configuration
- Upsert vectors with metadata
- Query vectors with filters
- Namespace support

### ChromaDB Admin UI (Streamlit)

#### Run with Docker
```bash
cd chroma-db
docker compose up --build -d
```
Then open [http://localhost:8502](http://localhost:8502)

**Features:**
- List, create, and delete collections
- View collection info and sample data
- Add vectors with embeddings, metadata, documents
- Query with filters and distance metrics
- Delete data by ID or filter