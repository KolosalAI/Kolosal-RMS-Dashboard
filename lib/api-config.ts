/**
 * API Configuration
 * 
 * Centralized configuration for all API endpoints.
 * These values can be overridden using environment variables.
 */

// Default fallback URLs if environment variables are not set
const DEFAULT_KOLOSAL_SERVER_URL = 'http://127.0.0.1:8084'
const DEFAULT_MARKITDOWN_SERVER_URL = 'http://127.0.0.1:8081'
const DEFAULT_DOCLING_SERVER_URL = 'http://127.0.0.1:8082'
const DEFAULT_EMBEDDING_MODEL_NAME = 'qwen3-embedding-4b'

// API Configuration object
export const apiConfig = {
  // Kolosal Server - Main server for LLM, embedding, and document operations
  kolosal: {
    baseUrl: process.env.NEXT_PUBLIC_KOLOSAL_SERVER_URL || DEFAULT_KOLOSAL_SERVER_URL,
    endpoints: {
      status: '/status',
      listDocuments: '/list_documents',
      infoDocuments: '/info_documents',
      removeDocuments: '/remove_documents',
      addDocuments: '/add_documents',
      retrieve: '/retrieve',
      chunking: '/chunking',
      parsePdf: '/parse_pdf',
      parseDocx: '/parse_docx',
      parseXlsx: '/parse_xlsx',
      parsePptx: '/parse_pptx',
      parseHtml: '/parse_html',
    }
  },

  // MarkItDown API - Document parsing service
  markitdown: {
    baseUrl: process.env.NEXT_PUBLIC_MARKITDOWN_SERVER_URL || DEFAULT_MARKITDOWN_SERVER_URL,
    endpoints: {
      health: '/health',
      parsePdf: '/parse_pdf',
      parseDocx: '/parse_docx',
      parseXlsx: '/parse_xlsx',
      parsePptx: '/parse_pptx',
      parseHtml: '/parse_html',
    }
  },

  // Docling API - Alternative document parsing service
  docling: {
    baseUrl: process.env.NEXT_PUBLIC_DOCLING_SERVER_URL || DEFAULT_DOCLING_SERVER_URL,
    endpoints: {
      health: '/health',
      // Add other Docling endpoints as needed
    }
  },

  // Model Configuration
  models: {
    embedding: process.env.NEXT_PUBLIC_EMBEDDING_MODEL_NAME || DEFAULT_EMBEDDING_MODEL_NAME,
  }
}

// Helper functions to build full URLs
export const buildApiUrl = (service: 'kolosal' | 'markitdown' | 'docling', endpoint: string): string => {
  const config = apiConfig[service]
  if (!config) {
    throw new Error(`Unknown service: ${service}`)
  }
  
  return `${config.baseUrl}${endpoint}`
}

// Convenience functions for each service
export const kolosalApi = {
  url: (endpoint: keyof typeof apiConfig.kolosal.endpoints): string => 
    buildApiUrl('kolosal', apiConfig.kolosal.endpoints[endpoint]),
  
  customUrl: (path: string): string => 
    buildApiUrl('kolosal', path)
}

export const markitdownApi = {
  url: (endpoint: keyof typeof apiConfig.markitdown.endpoints): string => 
    buildApiUrl('markitdown', apiConfig.markitdown.endpoints[endpoint]),
  
  customUrl: (path: string): string => 
    buildApiUrl('markitdown', path)
}

export const doclingApi = {
  url: (endpoint: keyof typeof apiConfig.docling.endpoints): string => 
    buildApiUrl('docling', apiConfig.docling.endpoints[endpoint]),
  
  customUrl: (path: string): string => 
    buildApiUrl('docling', path)
}

// Export the configuration for direct access if needed
export default apiConfig
