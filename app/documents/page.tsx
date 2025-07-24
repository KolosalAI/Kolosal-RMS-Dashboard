"use client"

import { useEffect, useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
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

export default function DocumentsPage() {
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
      const response = await fetch("http://127.0.0.1:8084/list_documents")

      if (!response.ok) {
        throw new Error(`Failed to fetch document list: ${response.status} ${response.statusText}`)
      }

      const data: DocumentListResponse = await response.json()
      setDocumentIds(data.document_ids)
      setTotalCount(data.total_count)
      setCollectionName(data.collection_name)

      // Reset to first page when document list changes
      setCurrentPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch document list")
    } finally {
      setLoading(false)
    }
  }

  // Fetch document info for current page
  const fetchDocumentInfo = async (page: number) => {
    if (documentIds.length === 0) return

    setDocumentsLoading(true)
    setError(null)

    try {
      const startIndex = (page - 1) * DOCUMENTS_PER_PAGE
      const endIndex = startIndex + DOCUMENTS_PER_PAGE
      const pageDocumentIds = documentIds.slice(startIndex, endIndex)

      const response = await fetch("http://127.0.0.1:8084/info_documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: pageDocumentIds,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch document info: ${response.status} ${response.statusText}`)
      }

      const data: DocumentInfoResponse = await response.json()
      setDocuments(data.documents)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch document information")
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchDocumentList()
  }, [])

  // Load documents when page changes or document IDs are loaded
  useEffect(() => {
    if (documentIds.length > 0) {
      fetchDocumentInfo(currentPage)
    }
  }, [currentPage, documentIds])

  const handlePreviousPage = () => {
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

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return
    }

    setDeletingIds((prev) => new Set(prev).add(documentId))

    try {
      const response = await fetch("http://127.0.0.1:8084/remove_documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_ids: [documentId],
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.status} ${response.statusText}`)
      }

      // Refresh the document list after successful deletion
      await fetchDocumentList()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document")
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Show Documents</h1>
                <p className="text-sm text-gray-500">View and manage your document collection</p>
              </div>
            </div>
            <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Collection Summary */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Collection Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading collection information...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Collection Name</p>
                      <p className="font-semibold text-gray-900">{collectionName || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Documents</p>
                      <p className="font-semibold text-gray-900">{totalCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Page</p>
                      <p className="font-semibold text-gray-900">
                        {totalCount > 0 ? `${currentPage} of ${totalPages}` : "0 of 0"}
                      </p>
                    </div>
                  </div>
                )}
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

            {/* Pagination Controls - Top */}
            {totalCount > DOCUMENTS_PER_PAGE && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * DOCUMENTS_PER_PAGE + 1} to{" "}
                      {Math.min(currentPage * DOCUMENTS_PER_PAGE, totalCount)} of {totalCount} documents
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage <= 1 || documentsLoading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 px-3">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages || documentsLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents List */}
            {documentsLoading ? (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Loading documents...</p>
                </CardContent>
              </Card>
            ) : documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((doc, index) => {
                  const globalIndex = (currentPage - 1) * DOCUMENTS_PER_PAGE + index + 1
                  return (
                    <Card key={doc.id} className="border border-gray-200 shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Document {globalIndex}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-mono text-xs">
                              {doc.id.slice(0, 8)}...
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
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
                      <CardContent className="space-y-4">
                        {/* Document Content */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                          <div className="bg-gray-50 rounded-lg p-4 border">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{doc.text}</p>
                          </div>
                        </div>

                        {/* Metadata */}
                        {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Metadata</h4>
                            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                              <pre className="text-sm text-gray-100 font-mono">
                                <code>{JSON.stringify(doc.metadata, null, 2)}</code>
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Document ID */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Document ID</h4>
                          <div className="bg-gray-100 rounded px-3 py-2 font-mono text-sm text-gray-700">{doc.id}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : !loading && totalCount === 0 ? (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No documents found</p>
                  <p className="text-sm text-gray-500">The document collection appears to be empty</p>
                </CardContent>
              </Card>
            ) : null}

            {/* Pagination Controls - Bottom */}
            {totalCount > DOCUMENTS_PER_PAGE && documents.length > 0 && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1 || documentsLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages || documentsLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
