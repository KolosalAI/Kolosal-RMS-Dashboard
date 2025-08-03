# Kolosal-RMS-Dashboard

Dashboard for user interaction with Kolosal Retrieval Management System

## Architecture

This dashboard uses **Next.js Server Components** to fetch data server-side, making it suitable for deployment in Docker containers where API endpoints are only accessible within the internal network.

## Environment Configuration

The dashboard connects to several API services. Configure the endpoints using environment variables:

### Server-Side Configuration (Recommended)

For Docker deployments, use server-side environment variables (without `NEXT_PUBLIC_` prefix):

```env
# Server-side API Configuration (used for server-side rendering)
KOLOSAL_SERVER_URL=http://host.docker.internal:8084
MARKITDOWN_SERVER_URL=http://host.docker.internal:8081
DOCLING_SERVER_URL=http://host.docker.internal:8082
EMBEDDING_MODEL_NAME=qwen3-embedding-4b
```

### Client-Side Configuration (Optional)

For client-side components or external API access:

```env
# Client-side API Configuration (used for client-side components)
NEXT_PUBLIC_KOLOSAL_SERVER_URL=http://localhost:8084
NEXT_PUBLIC_MARKITDOWN_SERVER_URL=http://localhost:8081
NEXT_PUBLIC_DOCLING_SERVER_URL=http://localhost:8082
NEXT_PUBLIC_EMBEDDING_MODEL_NAME=qwen3-embedding-4b
```

### Service Endpoints

- **Kolosal Server** (Port 8084): Main server that handles LLM inference, embeddings, document storage, and retrieval
- **MarkItDown API** (Port 8081): Document parsing service for converting various file formats to markdown
- **Docling API** (Port 8082): Advanced document parsing service with OCR, table structure recognition, and image processing

### Default Configuration

If no environment variables are set, the dashboard will use default Docker-compatible URLs:

- Kolosal Server: `http://host.docker.internal:8084`
- MarkItDown API: `http://host.docker.internal:8081`
- Docling API: `http://host.docker.internal:8082`
- Embedding Model: `qwen3-embedding-4b`

## Getting Started

### Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure environment (optional):

   ```bash
   # Create environment file for local development
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
     -e KOLOSAL_SERVER_URL=http://host.docker.internal:8084 \
     -e MARKITDOWN_SERVER_URL=http://host.docker.internal:8081 \
     -e DOCLING_SERVER_URL=http://host.docker.internal:8082 \
     -e EMBEDDING_MODEL_NAME=qwen3-embedding-4b \
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

When running in Docker, configure the API endpoints using server-side environment variables:

```bash
# Server-side Backend Service URLs (for server-side rendering)
KOLOSAL_SERVER_URL=http://host.docker.internal:8084
MARKITDOWN_SERVER_URL=http://host.docker.internal:8081
DOCLING_SERVER_URL=http://host.docker.internal:8082

# Model Configuration
EMBEDDING_MODEL_NAME=qwen3-embedding-4b

# Optional: Client-side URLs (for any client-side components)
NEXT_PUBLIC_KOLOSAL_SERVER_URL=http://localhost:8084
NEXT_PUBLIC_MARKITDOWN_SERVER_URL=http://localhost:8081
NEXT_PUBLIC_DOCLING_SERVER_URL=http://localhost:8082
```

**Note:**

- Server-side variables (without `NEXT_PUBLIC_`) are used for API calls made from the Next.js server
- Use `host.docker.internal` to access services running on your host machine from within Docker
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
     -e KOLOSAL_SERVER_URL=https://your-kolosal-server.com \
     -e MARKITDOWN_SERVER_URL=https://your-markitdown-api.com \
     -e DOCLING_SERVER_URL=https://your-docling-api.com \
     kolosal-rms-dashboard:production
   ```

## Features

- **Server-Side Rendering**: Dashboard data is fetched server-side, making it compatible with Docker environments where APIs are only accessible internally
- **Real-time Status Monitoring**: Monitor the health and status of all system components
- **Multi-Parser Document Processing**: Support for multiple document parsing engines:
  - **Kolosal Parser**: Native parsing for various document formats
  - **MarkItDown**: Microsoft's document parsing service
  - **Docling**: Advanced document parsing with OCR, table structure recognition, and image processing
- **Advanced Document Ingestion**: Upload and process documents with chunking strategies (regular, semantic, or no chunking)
- **Intelligent Retrieval**: Search and retrieve relevant document chunks using semantic similarity
- **Automatic Refresh**: Server-side data fetching with client-side refresh capability
- **Docker-Ready**: Optimized for Docker deployments with proper environment variable configuration
- **Responsive Design**: Works on desktop and mobile devices

## Architecture Notes

- **Server Components**: The main dashboard uses Next.js Server Components for data fetching
- **Client Components**: Only interactive elements (like the refresh button) use client-side JavaScript
- **API Isolation**: API calls are made server-side, so they work within Docker networks
- **Optimized Performance**: Server-side rendering reduces client-side JavaScript and improves load times
