# Kolosal-RMS-Dashboard

Dashboard for user interaction with Kolosal Retrieval Management System

## Environment Configuration

The dashboard connects to several API services. You can configure the endpoints by copying the environment template and customizing the URLs:

1. Copy the environment template:

   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` to customize the API endpoints:

   ```env
   # Kolosal Server Configuration (Main server for LLM, embedding, and document operations)
   NEXT_PUBLIC_KOLOSAL_SERVER_URL=http://127.0.0.1:8084

   # MarkItDown API Configuration  
   NEXT_PUBLIC_MARKITDOWN_SERVER_URL=http://127.0.0.1:8081

   # Docling API Configuration
   NEXT_PUBLIC_DOCLING_SERVER_URL=http://127.0.0.1:8082

   # Embedding Model Configuration
   NEXT_PUBLIC_EMBEDDING_MODEL_NAME=qwen3-embedding-4b
   ```

### Service Endpoints

- **Kolosal Server** (Port 8084): Main server that handles LLM inference, embeddings, document storage, and retrieval
- **MarkItDown API** (Port 8081): Document parsing service for converting various file formats to markdown
- **Docling API** (Port 8082): Alternative document parsing service

### Model Configuration

- **Embedding Model**: The model used for semantic chunking and document embeddings (default: `qwen3-embedding-4b`)

### Default Configuration

If no environment variables are set, the dashboard will use the default localhost URLs and model settings:

- Kolosal Server: `http://127.0.0.1:8084`
- MarkItDown API: `http://127.0.0.1:8081`
- Docling API: `http://127.0.0.1:8082`
- Embedding Model: `qwen3-embedding-4b`

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure environment (optional):

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local as needed
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

### Quick Start with Docker

1. **Build the Docker image:**

   ```bash
   docker build -t kolosal-rms-dashboard:latest .
   ```

   Or use the provided build script:

   ```bash
   # Linux/macOS
   chmod +x build-docker.sh
   ./build-docker.sh

   # Windows
   build-docker.bat
   ```

2. **Run the container:**

   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_KOLOSAL_SERVER_URL=http://host.docker.internal:8084 \
     -e NEXT_PUBLIC_MARKITDOWN_SERVER_URL=http://host.docker.internal:8081 \
     -e NEXT_PUBLIC_DOCLING_SERVER_URL=http://host.docker.internal:8082 \
     -e NEXT_PUBLIC_EMBEDDING_MODEL_NAME=qwen3-embedding-4b \
     kolosal-rms-dashboard:latest
   ```

3. **Access the dashboard at:** [http://localhost:3000](http://localhost:3000)

### Docker Compose (Recommended)

For easier management, use Docker Compose:

1. **Start the services:**

   ```bash
   docker-compose up -d
   ```

2. **View logs:**

   ```bash
   docker-compose logs -f kolosal-dashboard
   ```

3. **Stop the services:**

   ```bash
   docker-compose down
   ```

### Docker Environment Configuration

When running in Docker, configure the API endpoints using environment variables:

```bash
# Backend Service URLs (adjust to your setup)
NEXT_PUBLIC_KOLOSAL_SERVER_URL=http://host.docker.internal:8084
NEXT_PUBLIC_MARKITDOWN_SERVER_URL=http://host.docker.internal:8081
NEXT_PUBLIC_DOCLING_SERVER_URL=http://host.docker.internal:8082

# Model Configuration
NEXT_PUBLIC_EMBEDDING_MODEL_NAME=qwen3-embedding-4b
```

**Note:**

- Use `host.docker.internal` to access services running on your host machine
- If your backend services are also running in Docker containers, use the container names or service names instead
- Update the `docker-compose.yml` file to include your backend services if needed

### Production Deployment

For production deployment:

1. **Build optimized image:**

   ```bash
   docker build --target runner -t kolosal-rms-dashboard:production .
   ```

2. **Run with production settings:**

   ```bash
   docker run -d \
     --name kolosal-dashboard \
     --restart unless-stopped \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -e NEXT_PUBLIC_KOLOSAL_SERVER_URL=https://your-kolosal-server.com \
     -e NEXT_PUBLIC_MARKITDOWN_SERVER_URL=https://your-markitdown-api.com \
     -e NEXT_PUBLIC_DOCLING_SERVER_URL=https://your-docling-api.com \
     kolosal-rms-dashboard:production
   ```
