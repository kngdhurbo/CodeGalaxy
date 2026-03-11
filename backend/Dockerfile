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

# Expose the Railway expected port
EXPOSE 8000

# Start FastAPI server on generic host 
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
