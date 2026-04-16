# filepath: pinecone-db/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir streamlit pinecone

# Copy app
COPY pinecone_admin_ui.py .

# Expose Streamlit port
EXPOSE 8501

# Run Streamlit
CMD ["streamlit", "run", "pinecone_admin_ui.py", "--server.address", "0.0.0.0"]