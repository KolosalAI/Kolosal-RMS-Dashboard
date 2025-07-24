"use client"

import type React from "react"

import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Loader2, FileText, Clock, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { kolosalApi } from "@/lib/api-config"

interface Document {
  id: string
  content: string
  metadata: Record<string, any>
  score?: number
}

interface RetrieveResponse {
  documents: Document[]
  query: string
  total_results: number
  elapsed_time: number
}

export default function RetrievePage() {
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(10)
  const [scoreThreshold, setScoreThreshold] = useState(0.5)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RetrieveResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query")
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const startTime = Date.now()
      const response = await fetch(kolosalApi.url('retrieve'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: limit,
          score_threshold: scoreThreshold,
        }),
      })

      const elapsedTime = (Date.now() - startTime) / 1000

      if (!response.ok) {
        throw new Error(`Failed to retrieve documents: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setResults({
        documents: data.documents || [],
        query: query.trim(),
        total_results: data.documents?.length || 0,
        elapsed_time: elapsedTime,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while searching")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Retrieve</h1>
              <p className="text-sm text-gray-500">Search and retrieve information from your documents</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Search Form */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Search Query
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="query">Query</Label>
                  <Textarea
                    id="query"
                    placeholder="Enter your search query here..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[100px] resize-none"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="limit">Limit</Label>
                    <Input
                      id="limit"
                      type="number"
                      min="1"
                      max="100"
                      value={limit}
                      onChange={(e) => setLimit(Number.parseInt(e.target.value) || 10)}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">Maximum number of results (1-100)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold">Score Threshold</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={scoreThreshold}
                      onChange={(e) => setScoreThreshold(Number.parseFloat(e.target.value) || 0.5)}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">Minimum similarity score (0.0-1.0)</p>
                  </div>
                </div>

                <Button onClick={handleSearch} disabled={loading || !query.trim()} className="w-full md:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
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

            {/* Results */}
            {results && (
              <div className="space-y-4">
                {/* Results Summary */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span className="font-medium">{results.total_results}</span>
                        <span>results found</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{results.elapsed_time.toFixed(3)}s</span>
                        <span>elapsed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        <span className="font-medium">"{results.query}"</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Results List */}
                {results.documents.length > 0 ? (
                  <div className="space-y-4">
                    {results.documents.map((doc, index) => (
                      <Card key={doc.id || index} className="border border-gray-200 shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <FileText className="h-5 w-5 text-blue-600" />
                              Document {index + 1}
                            </CardTitle>
                            {doc.score && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Score: {doc.score.toFixed(3)}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Document Content */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Content</h4>
                            <div className="bg-gray-50 rounded-lg p-4 border">
                              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{doc.content}</p>
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
                          {doc.id && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Document ID</h4>
                              <div className="bg-gray-100 rounded px-3 py-2 font-mono text-sm text-gray-700">
                                {doc.id}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border border-gray-200 shadow-sm">
                    <CardContent className="pt-6 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No documents found</p>
                      <p className="text-sm text-gray-500">Try adjusting your query or lowering the score threshold</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
