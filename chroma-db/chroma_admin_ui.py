# filepath: chroma_admin_ui.py
"""
ChromaDB Admin UI
Run: streamlit run chroma_admin_ui.py
"""

import streamlit as st
import chromadb
from chromadb.config import Settings

st.set_page_config(page_title="ChromaDB Admin", layout="wide")
st.title("📦 ChromaDB Admin")

# Connection settings
import os
col1, col2, col3 = st.columns([1, 1, 1])
with col1:
    default_host = os.environ.get("CHROMA_HOST", "localhost")
    host = st.text_input("Host", value=default_host)
with col2:
    default_port = os.environ.get("CHROMA_PORT", "8000")
    port = st.text_input("Port", value=default_port)
with col3:
    ssl = st.checkbox("SSL", value=False)

try:
    chroma_client = chromadb.HttpClient(
        host=host,
        port=port,
        ssl=ssl
    )
    # Verify connection
    chroma_client.heartbeat()
    st.success("✅ Connected to ChromaDB")
except Exception as e:
    st.error(f"Connection failed: {e}")
    st.stop()

# Sidebar - Collection management
st.sidebar.header("Collections")

try:
    collections = chroma_client.list_collections()
    collection_names = [c.name for c in collections]
except Exception as e:
    st.error(f"Failed to list collections: {e}")
    collection_names = []

# Create new collection
st.sidebar.subheader("Create Collection")
new_collection_name = st.sidebar.text_input("Collection Name")

if st.sidebar.button("Create Collection"):
    if new_collection_name in collection_names:
        st.sidebar.error("Collection already exists")
    else:
        try:
            chroma_client.create_collection(name=new_collection_name)
            st.sidebar.success(f"Created: {new_collection_name}")
            st.rerun()
        except Exception as e:
            st.sidebar.error(f"Failed: {e}")

# Delete collection
if collection_names:
    delete_collection = st.sidebar.selectbox("Delete Collection", collection_names)
    if st.sidebar.button("Delete Collection", type="primary"):
        try:
            chroma_client.delete_collection(name=delete_collection)
            st.sidebar.success(f"Deleted: {delete_collection}")
            st.rerun()
        except Exception as e:
            st.sidebar.error(f"Failed: {e}")

# Main content
if not collection_names:
    st.info("No collections found. Create one from the sidebar.")
    st.stop()

# Select collection
selected_collection = st.selectbox("Select Collection", collection_names)

if selected_collection:
    try:
        collection = chroma_client.get_collection(name=selected_collection)
        
        # Tabs
        tab1, tab2, tab3, tab4 = st.tabs(["📊 Info", "📝 Add Data", "🔍 Query", "🗑️ Delete"])
        
        with tab1:
            st.subheader(f"Collection: {selected_collection}")
            
            # Collection info
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Name", collection.name)
            with col2:
                try:
                    count = collection.count()
                    st.metric("Total Items", count)
                except:
                    st.metric("Total Items", "N/A")
            
            # Peek at data
            st.subheader("Sample Data")
            try:
                peek = collection.peek(limit=5)
                if peek["ids"]:
                    for i, idx in enumerate(peek["ids"]):
                        st.markdown(f"**ID: {idx}**")
                        if "metadatas" in peek and peek["metadatas"]:
                            st.markdown(f"Metadata: `{peek['metadatas'][i]}`")
                        if "documents" in peek and peek["documents"]:
                            st.markdown(f"Document: {peek['documents'][i][:100]}...")
                        st.divider()
                else:
                    st.info("No data in collection")
            except Exception as e:
                st.error(f"Peek failed: {e}")
        
        with tab2:
            st.subheader("Add Data")
            
            num_items = st.number_input("Number of items", min_value=1, max_value=100, value=3)
            
            ids = []
            embeddings = []
            metadatas = []
            documents = []
            
            for i in range(num_items):
                st.markdown(f"**Item {i+1}**")
                col1, col2 = st.columns(2)
                with col1:
                    item_id = st.text_input(f"ID {i+1}", value=f"id-{i+1}", key=f"id_{i}")
                    ids.append(item_id)
                with col2:
                    # Generate sample embedding (3 dimensions for simplicity)
                    dim = st.number_input(f"Dimension (item {i+1})", min_value=1, value=3, key=f"dim_{i}")
                    default_emb = ", ".join(["0.1"] * dim)
                    emb_str = st.text_area(f"Embedding (comma-separated)", value=default_emb, key=f"emb_{i}")
                    try:
                        emb = [float(x.strip()) for x in emb_str.split(",")]
                        embeddings.append(emb)
                    except:
                        embeddings.append([0.1] * dim)
                
                default_meta = '{"source": "test"}'
                meta_str = st.text_area(f"Metadata (JSON)", value=default_meta, key=f"meta_{i}")
                try:
                    import json
                    metadata = json.loads(meta_str)
                except:
                    metadata = {"source": "test"}
                metadatas.append(metadata)
                
                doc = st.text_area(f"Document text", value=f"Sample document {i+1}", key=f"doc_{i}")
                documents.append(doc)
                st.divider()
            
            if st.button("Add Data"):
                try:
                    collection.add(
                        ids=ids,
                        embeddings=embeddings,
                        metadatas=metadatas,
                        documents=documents
                    )
                    st.success(f"Added {len(ids)} items")
                except Exception as e:
                    st.error(f"Failed: {e}")
        
        with tab3:
            st.subheader("Query Collection")
            
            # Query embedding
            query_dim = st.number_input("Query Dimension", min_value=1, value=3)
            query_emb_str = st.text_area("Query Embedding (comma-separated)", 
                                         value=", ".join(["0.1"] * query_dim))
            try:
                query_emb = [float(x.strip()) for x in query_emb_str.split(",")]
            except:
                query_emb = [0.1] * query_dim
            
            n_results = st.number_input("Number of Results", min_value=1, max_value=100, value=5)
            
            # Where filter
            where_json = st.text_area("Where Filter (JSON)", value="{}")
            try:
                where_filter = json.loads(where_json) if where_json.strip() else None
            except:
                where_filter = None
                st.warning("Invalid where filter JSON")
            
            # Include fields
            col1, col2, col3 = st.columns(3)
            with col1:
                include_metadatas = st.checkbox("Include Metadatas", value=True)
            with col2:
                include_documents = st.checkbox("Include Documents", value=True)
            with col3:
                include_distances = st.checkbox("Include Distances", value=True)
            
            if st.button("Query"):
                try:
                    results = collection.query(
                        query_embeddings=[query_emb],
                        n_results=n_results,
                        where=where_filter,
                        include_metadatas=include_metadatas,
                        include_documents=include_documents,
                        include_distances=include_distances
                    )
                    
                    st.subheader("Results")
                    
                    # Display results
                    if results["ids"] and results["ids"][0]:
                        for i, idx in enumerate(results["ids"][0]):
                            st.markdown(f"**Rank {i+1}: {idx}**")
                            if include_distances and "distances" in results:
                                st.metric("Distance", f"{results['distances'][0][i]:.4f}")
                            if include_metadatas and "metadatas" in results:
                                st.markdown(f"Metadata: `{results['metadatas'][0][i]}`")
                            if include_documents and "documents" in results:
                                st.markdown(f"Document: {results['documents'][0][i][:200]}...")
                            st.divider()
                    else:
                        st.info("No results found")
                except Exception as e:
                    st.error(f"Query failed: {e}")
        
        with tab4:
            st.subheader("Delete Data")
            
            delete_by_id = st.text_input("Delete by ID (leave empty to skip)")
            delete_where_json = st.text_area("Delete by Filter (JSON)", value="{}")
            
            col1, col2 = st.columns(2)
            with col1:
                delete_all = st.checkbox("Delete all data", value=False)
            with col2:
                if st.button("Delete", type="primary"):
                    try:
                        if delete_all:
                            collection.delete(where={})
                            st.success("Deleted all data")
                            st.rerun()
                        elif delete_by_id:
                            collection.delete(ids=[delete_by_id])
                            st.success(f"Deleted: {delete_by_id}")
                        else:
                            try:
                                where = json.loads(delete_where_json) if delete_where_json.strip() else None
                                if where:
                                    collection.delete(where=where)
                                    st.success("Deleted by filter")
                                else:
                                    st.warning("Specify ID, filter, or check 'Delete all'")
                            except:
                                st.error("Invalid filter JSON")
                    except Exception as e:
                        st.error(f"Failed: {e}")
    
    except Exception as e:
        st.error(f"Error: {e}")

import json