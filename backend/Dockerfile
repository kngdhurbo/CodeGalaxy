FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install build dependencies for C-extensions (tree-sitter, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create an empty sqlite db for the build process (it will be persisted via volumes later if needed)
RUN touch codegalaxy.db

# Copy project code
COPY . .

# Expose the default port (can be overridden by Railway)
EXPOSE 8000

# Start FastAPI server binding to 0.0.0.0 and the dynamic Railway $PORT
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
