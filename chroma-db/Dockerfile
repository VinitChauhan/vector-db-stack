# filepath: chroma-ui/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir streamlit chromadb

# Copy app
COPY chroma_admin_ui.py .

# Expose Streamlit port
EXPOSE 8502

# Run Streamlit
CMD ["streamlit", "run", "chroma_admin_ui.py", "--server.address", "0.0.0.0", "--server.port", "8502"]