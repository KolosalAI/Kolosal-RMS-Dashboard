"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Loader2, FileText, Clock, Hash } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

export default function RetrieveClient() {
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
      const response = await fetch('/api/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          limit,
          score_threshold: scoreThreshold
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to retrieve documents')
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retrieve documents")
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

  const formatScore = (score?: number) => {
    if (score === undefined) return "N/A"
    return (score * 100).toFixed(1) + "%"
  }

  const formatElapsedTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const truncateText = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Search Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Query Input */}
          <div className="space-y-2">
            <Label>Search Query</Label>
            <Textarea
              placeholder="Enter your search query here..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[100px]"
            />
          </div>

          {/* Search Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Result Limit</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={limit}
                onChange={(e) => setLimit(Number.parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="space-y-2">
              <Label>Score Threshold</Label>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={scoreThreshold}
                onChange={(e) => setScoreThreshold(Number.parseFloat(e.target.value) || 0.5)}
              />
              <p className="text-xs text-gray-500">Minimum similarity score (0.0-1.0)</p>
            </div>
          </div>

          {/* Search Button */}
          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Documents
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

      {/* Results Section */}
      {results && (
        <>
          {/* Results Summary */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>{results.total_results}</strong> results found
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      <strong>{formatElapsedTime(results.elapsed_time)}</strong>
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Query: "{results.query}"
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Results List */}
          <div className="space-y-4">
            {results.documents.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
                  <p className="text-gray-500">
                    No documents match your search criteria. Try adjusting your query or lowering the score threshold.
                  </p>
                </CardContent>
              </Card>
            ) : (
              results.documents.map((doc, index) => (
                <Card key={doc.id || index} className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Document {index + 1}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          ID: {doc.id}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            (doc.score || 0) > 0.8
                              ? "border-green-300 text-green-700"
                              : (doc.score || 0) > 0.6
                                ? "border-yellow-300 text-yellow-700"
                                : "border-red-300 text-red-700"
                          }`}
                        >
                          Score: {formatScore(doc.score)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Document Content */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Content</Label>
                        <div className="mt-1 bg-gray-50 rounded-lg p-4 border">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {truncateText(doc.content)}
                          </p>
                          {doc.content.length > 300 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">
                                Show full content
                              </summary>
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{doc.content}</p>
                              </div>
                            </details>
                          )}
                        </div>
                      </div>

                      {/* Document Metadata */}
                      {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Metadata</Label>
                          <details className="mt-1">
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
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
