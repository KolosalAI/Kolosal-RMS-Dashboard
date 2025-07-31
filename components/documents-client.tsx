"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ChevronLeft, ChevronRight, Database, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DocumentInfo {
  id: string
  text: string
  metadata: Record<string, any>
}

interface DocumentListResponse {
  collection_name: string
  document_ids: string[]
  total_count: number
}

interface DocumentInfoResponse {
  collection_name: string
  documents: DocumentInfo[]
  found_count: number
  not_found_count: number
  not_found_ids: string[]
}

const DOCUMENTS_PER_PAGE = 10

export default function DocumentsClient() {
  const [documentIds, setDocumentIds] = useState<string[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [collectionName, setCollectionName] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const totalPages = Math.ceil(totalCount / DOCUMENTS_PER_PAGE)

  // Fetch document list
  const fetchDocumentList = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/documents/list')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch document list')
      }

      const data: DocumentListResponse = await response.json()
      setDocumentIds(data.document_ids || [])
      setTotalCount(data.total_count || 0)
      setCollectionName(data.collection_name || "")
      
      // Reset to first page if current page is out of bounds
      const newTotalPages = Math.ceil((data.total_count || 0) / DOCUMENTS_PER_PAGE)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(1)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch document list")
      setDocumentIds([])
      setTotalCount(0)
      setCollectionName("")
    } finally {
      setLoading(false)
    }
  }

  // Fetch documents for current page
  const fetchDocuments = async () => {
    if (documentIds.length === 0) {
      setDocuments([])
      return
    }

    setDocumentsLoading(true)
    setError(null)

    try {
      const startIndex = (currentPage - 1) * DOCUMENTS_PER_PAGE
      const endIndex = Math.min(startIndex + DOCUMENTS_PER_PAGE, documentIds.length)
      const pageDocumentIds = documentIds.slice(startIndex, endIndex)

      const response = await fetch('/api/documents/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: pageDocumentIds }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch document info')
      }

      const data: DocumentInfoResponse = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch documents")
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }

  // Delete document
  const handleDeleteDocument = async (documentId: string) => {
    if (deletingIds.has(documentId)) return

    setDeletingIds(prev => new Set(prev).add(documentId))
    setError(null)

    try {
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: [documentId] }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete document')
      }

      // Refresh the document list
      await fetchDocumentList()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document")
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  // Navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleRefresh = () => {
    fetchDocumentList()
  }

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  // Initial load and page changes
  useEffect(() => {
    fetchDocumentList()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [currentPage, documentIds])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Document Collection
            </CardTitle>
            <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
              <div className="text-sm text-blue-600">Total Documents</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalPages}</div>
              <div className="text-sm text-green-600">Total Pages</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600 truncate">{collectionName || "Unknown"}</div>
              <div className="text-sm text-purple-600">Collection Name</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {loading ? (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          </CardContent>
        </Card>
      ) : totalCount === 0 ? (
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-500">
              The document collection is empty. Start by ingesting some documents.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pagination Controls */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {Math.min((currentPage - 1) * DOCUMENTS_PER_PAGE + 1, totalCount)} to{" "}
                  {Math.min(currentPage * DOCUMENTS_PER_PAGE, totalCount)} of {totalCount} documents
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || documentsLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || documentsLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          {documentsLoading ? (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading page documents...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {documents.map((doc, index) => (
                <Card key={doc.id} className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Document {(currentPage - 1) * DOCUMENTS_PER_PAGE + index + 1}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {doc.id}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={deletingIds.has(doc.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingIds.has(doc.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Document Content */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-2">Content</div>
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {truncateText(doc.text)}
                          </p>
                          {doc.text.length > 200 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">
                                Show full content
                              </summary>
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{doc.text}</p>
                              </div>
                            </details>
                          )}
                        </div>
                      </div>

                      {/* Document Metadata */}
                      {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">Metadata</div>
                          <details>
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 text-sm">
                              Show metadata
                            </summary>
                            <div className="mt-2 bg-gray-50 rounded-lg p-3 border">
                              <pre className="text-xs text-gray-700 overflow-x-auto">
                                {JSON.stringify(doc.metadata, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
