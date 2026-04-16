# filepath: pinecone_admin_ui.py
"""
Pinecone Local Admin UI
Run: streamlit run pinecone_admin_ui.py
"""

import streamlit as st
import json

# Use HTTP client instead of gRPC to avoid dependency issues
from pinecone import Pinecone, ServerlessSpec

st.set_page_config(page_title="Pinecone Local Admin", layout="wide")
st.title("📦 Pinecone Local Admin")

# Connection settings
import os
col1, col2 = st.columns([1, 3])
with col1:
    default_host = os.environ.get("PINECONE_HOST", "localhost:5080")
    host = st.text_input("Host", value=default_host)
    api_key = st.text_input("API Key", value="pclocal", type="password")

if not host or not api_key:
    st.warning("Please enter host and API key")
    st.stop()

try:
    pc = Pinecone(api_key=api_key, host=f"http://{host}")
    st.success("✅ Connected to Pinecone Local")
except Exception as e:
    st.error(f"Connection failed: {e}")
    st.stop()

# Sidebar - Index management
st.sidebar.header("Indexes")

try:
    indexes = pc.list_indexes()
except Exception as e:
    st.error(f"Failed to list indexes: {e}")
    indexes = []

# Create new index
st.sidebar.subheader("Create Index")
new_index_name = st.sidebar.text_input("Index Name")
new_index_dimension = st.sidebar.number_input("Dimension", min_value=1, value=2)
new_index_metric = st.sidebar.selectbox("Metric", ["cosine", "euclidean", "dotproduct"])
new_index_vector_type = st.sidebar.selectbox("Vector Type", ["dense", "sparse"])

if st.sidebar.button("Create Index"):
    if new_index_name in indexes:
        st.sidebar.error("Index already exists")
    else:
        try:
            pc.create_index(
                name=new_index_name,
                vector_type=new_index_vector_type,
                dimension=new_index_dimension,
                metric=new_index_metric,
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
                deletion_protection="disabled"
            )
            st.sidebar.success(f"Created index: {new_index_name}")
            st.rerun()
        except Exception as e:
            st.sidebar.error(f"Failed: {e}")

# Delete index
if indexes:
    delete_index = st.sidebar.selectbox("Delete Index", indexes)
    if st.sidebar.button("Delete Index", type="primary"):
        try:
            pc.delete_index(name=delete_index)
            st.sidebar.success(f"Deleted: {delete_index}")
            st.rerun()
        except Exception as e:
            st.sidebar.error(f"Failed: {e}")

# Main content
if not indexes:
    st.info("No indexes found. Create one from the sidebar.")
    st.stop()

# Select index
selected_index = st.selectbox("Select Index", indexes)

if selected_index:
    try:
        index_info = pc.describe_index(selected_index)
        index_host = index_info.host
        index = pc.Index(host=index_host)
        
        # Tabs
        tab1, tab2, tab3 = st.tabs(["📊 Stats", "📝 Upsert", "🔍 Query"])
        
        with tab1:
            st.subheader(f"Index: {selected_index}")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Dimension", index_info.dimension)
            with col2:
                st.metric("Metric", index_info.metric)
            with col3:
                st.metric("Vector Type", index_info.vector_type)
            
            st.subheader("Index Stats")
            stats = index.describe_index_stats()
            st.json(stats)
        
        with tab2:
            st.subheader("Upsert Vectors")
            
            vector_type = index_info.vector_type
            
            if vector_type == "dense":
                num_vectors = st.number_input("Number of vectors", min_value=1, max_value=100, value=3)
                
                vectors = []
                for i in range(num_vectors):
                    st.markdown(f"**Vector {i+1}**")
                    col1, col2 = st.columns(2)
                    with col1:
                        vec_id = st.text_input(f"ID {i+1}", value=f"vec{i+1}", key=f"id_{i}")
                    with col2:
                        dimension = index_info.dimension
                        # Generate sample values based on dimension
                        default_values = ", ".join(["0.1"] * min(dimension, 5))
                        values_str = st.text_area(f"Values (comma-separated, dim={dimension})", 
                                                  value=default_values, key=f"val_{i}")
                        try:
                            values = [float(x.strip()) for x in values_str.split(",")]
                        except:
                            values = []
                    
                    default_meta = '{"source": "test"}'
                    metadata_str = st.text_area(f"Metadata (JSON)", value=default_meta, key=f"meta_{i}")
                    try:
                        import json
                        metadata = json.loads(metadata_str)
                    except:
                        metadata = {}
                    
                    vectors.append({
                        "id": vec_id,
                        "values": values,
                        "metadata": metadata
                    })
                    st.divider()
                
                namespace = st.text_input("Namespace", value="")
                
                if st.button("Upsert Vectors"):
                    try:
                        index.upsert(vectors=vectors, namespace=namespace if namespace else None)
                        st.success(f"Upserted {len(vectors)} vectors")
                    except Exception as e:
                        st.error(f"Failed: {e}")
            
            else:  # sparse
                st.info("Sparse vector upsert - use Python client for now")
        
        with tab3:
            st.subheader("Query Index")
            
            if vector_type == "dense":
                query_vector_str = st.text_area("Query Vector (comma-separated)", value="0.1, 0.2")
                try:
                    query_vector = [float(x.strip()) for x in query_vector_str.split(",")]
                except:
                    query_vector = []
                
                top_k = st.number_input("Top K", min_value=1, max_value=100, value=10)
                include_metadata = st.checkbox("Include Metadata", value=True)
                include_values = st.checkbox("Include Values", value=False)
                
                # Filter
                filter_json = st.text_area("Filter (JSON)", value='{}')
                try:
                    filter_dict = json.loads(filter_json) if filter_json.strip() else {}
                except:
                    filter_dict = {}
                    st.warning("Invalid filter JSON")
                
                namespace = st.text_input("Namespace", value="")
                
                if st.button("Query"):
                    try:
                        results = index.query(
                            vector=query_vector,
                            top_k=top_k,
                            namespace=namespace if namespace else None,
                            filter=filter_dict if filter_dict else None,
                            include_metadata=include_metadata,
                            include_values=include_values
                        )
                        st.subheader("Results")
                        st.json(results)
                    except Exception as e:
                        st.error(f"Query failed: {e}")
            else:
                st.info("Sparse vector query - use Python client for now")
    
    except Exception as e:
        st.error(f"Error: {e}")