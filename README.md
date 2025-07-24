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
   ```

### Service Endpoints

- **Kolosal Server** (Port 8084): Main server that handles LLM inference, embeddings, document storage, and retrieval
- **MarkItDown API** (Port 8081): Document parsing service for converting various file formats to markdown
- **Docling API** (Port 8082): Alternative document parsing service

### Default Configuration

If no environment variables are set, the dashboard will use the default localhost URLs:

- Kolosal Server: `http://127.0.0.1:8084`
- MarkItDown API: `http://127.0.0.1:8081`
- Docling API: `http://127.0.0.1:8082`

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
