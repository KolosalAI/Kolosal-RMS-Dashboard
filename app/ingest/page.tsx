"use client"

import type React from "react"

import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Loader2, Trash2, Edit3, Save, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ChunkedDocument {
  id: string
  text: string
  metadata: Record<string, any>
  isEditing?: boolean
}

interface ParsedDocument {
  filename: string
  title: string
  markdown_content: string
  metadata: Record<string, any>
}

type DocumentType = "pdf" | "docx" | "xlsx" | "pptx" | "html" | "text"
type ParserType = "kolosal" | "markitdown" | "docling"
type ChunkingType = "regular" | "semantic" | "none"

export default function IngestPage() {
  const [documentType, setDocumentType] = useState<DocumentType | "">("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState("")
  const [parserType, setParserType] = useState<ParserType | "">("")
  const [chunkingType, setChunkingType] = useState<ChunkingType | "">("")
  const [similarityThreshold, setSimilarityThreshold] = useState(0.6)

  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null)
  const [chunkedDocuments, setChunkedDocuments] = useState<ChunkedDocument[]>([])
  const [originalText, setOriginalText] = useState("")

  const [isIngesting, setIsIngesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handlePreprocessDocuments = async () => {
    if (!documentType) {
      setError("Please select a document type")
      return
    }

    if (documentType !== "text" && !selectedFile) {
      setError("Please select a file")
      return
    }

    if (documentType === "text" && !textContent.trim()) {
      setError("Please enter text content")
      return
    }

    if (!parserType) {
      setError("Please select a parser")
      return
    }

    if (!chunkingType) {
      setError("Please select a chunking type")
      return
    }

    setIsProcessing(true)
    setError(null)
    setParsedDocument(null)
    setChunkedDocuments([])

    try {
      let parsedText = ""
      let parsedMetadata = {}

      // Step 1: Parse the document
      if (documentType === "text") {
        parsedText = textContent
        parsedMetadata = { type: "text", length: textContent.length }
      } else {
        // Parse using selected parser
        if (parserType === "kolosal") {
          parsedText = await parseWithKolosal(selectedFile!, documentType)
        } else if (parserType === "markitdown") {
          const result = await parseWithMarkitdown(selectedFile!, documentType)
          parsedText = result.markdown_content
          parsedMetadata = result.metadata
          setParsedDocument(result)
        } else {
          throw new Error("Docling parser is not yet supported")
        }
      }

      setOriginalText(parsedText)

      // Step 2: Chunk the document
      if (chunkingType === "none") {
        setChunkedDocuments([
          {
            id: "1",
            text: parsedText,
            metadata: parsedMetadata,
          },
        ])
      } else {
        const chunks = await chunkDocument(parsedText, chunkingType, similarityThreshold)
        setChunkedDocuments(
          chunks.map((chunk, index) => ({
            id: `chunk-${index + 1}`,
            text: chunk.text || chunk,
            metadata: { ...parsedMetadata, chunk_index: index + 1 },
          })),
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process document")
    } finally {
      setIsProcessing(false)
    }
  }

  const parseWithKolosal = async (file: File, type: DocumentType): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    const endpoint = type === "pdf" ? "/parse_pdf" : `/parse_${type}`
    const response = await fetch(`http://127.0.0.1:8084${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: base64Data,
        method: "fast",
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to parse with Kolosal: ${response.statusText}`)
    }

    const result = await response.json()
    return result.text || result.content || JSON.stringify(result)
  }

  const parseWithMarkitdown = async (file: File, type: DocumentType): Promise<ParsedDocument> => {
    const formData = new FormData()
    formData.append("file", file)

    const endpoint = `/parse_${type}`
    const response = await fetch(`http://127.0.0.1:8081${endpoint}`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to parse with MarkItDown: ${response.statusText}`)
    }

    return await response.json()
  }

  const chunkDocument = async (text: string, method: ChunkingType, threshold?: number) => {
    const payload: any = {
      text: text,
      model_name: "qwen3-embedding-0.6b",
      method: method,
    }

    if (method === "semantic" && threshold) {
      payload.similarity_threshold = threshold
    }

    const response = await fetch("http://127.0.0.1:8084/chunking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Failed to chunk document: ${response.statusText}`)
    }

    const result = await response.json()
    return result.chunks || [text]
  }

  const handleDeleteChunk = (chunkId: string) => {
    setChunkedDocuments((prev) => prev.filter((chunk) => chunk.id !== chunkId))
  }

  const handleEditChunk = (chunkId: string) => {
    setChunkedDocuments((prev) => prev.map((chunk) => (chunk.id === chunkId ? { ...chunk, isEditing: true } : chunk)))
  }

  const handleSaveChunk = (chunkId: string, newText: string, newMetadata: string) => {
    try {
      const metadata = JSON.parse(newMetadata)
      setChunkedDocuments((prev) =>
        prev.map((chunk) => (chunk.id === chunkId ? { ...chunk, text: newText, metadata, isEditing: false } : chunk)),
      )
    } catch (err) {
      setError("Invalid JSON in metadata")
    }
  }

  const handleCancelEdit = (chunkId: string) => {
    setChunkedDocuments((prev) => prev.map((chunk) => (chunk.id === chunkId ? { ...chunk, isEditing: false } : chunk)))
  }

  const handleAddDocuments = async () => {
    if (chunkedDocuments.length === 0) {
      setError("No documents to add")
      return
    }

    setIsIngesting(true)
    setError(null)
    setSuccess(null)

    try {
      const documents = chunkedDocuments.map((chunk) => ({
        text: chunk.text,
        metadata: chunk.metadata,
      }))

      const response = await fetch("http://127.0.0.1:8084/add_documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add documents: ${response.statusText}`)
      }

      const result = await response.json()
      setSuccess(`Successfully added ${chunkedDocuments.length} documents to the collection`)

      // Reset form
      setDocumentType("")
      setSelectedFile(null)
      setTextContent("")
      setParserType("")
      setChunkingType("")
      setParsedDocument(null)
      setChunkedDocuments([])
      setOriginalText("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add documents")
    } finally {
      setIsIngesting(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ingest Documents</h1>
              <p className="text-sm text-gray-500">Upload and process documents for retrieval</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Configuration Section */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Document Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Document Type Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Document Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { value: "pdf", label: "PDF", icon: "📄" },
                      { value: "docx", label: "DOCX", icon: "📝" },
                      { value: "xlsx", label: "XLSX", icon: "📊" },
                      { value: "pptx", label: "PPTX", icon: "📋" },
                      { value: "html", label: "HTML", icon: "🌐" },
                      { value: "text", label: "Text", icon: "📃" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setDocumentType(type.value as DocumentType)}
                        className={`
          flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
          ${
            documentType === type.value
              ? "border-blue-500 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
          }
        `}
                      >
                        <span className="text-2xl mb-2">{type.icon}</span>
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload or Text Input */}
                {documentType && documentType !== "text" && (
                  <div className="space-y-2">
                    <Label>Upload File</Label>
                    <Input
                      type="file"
                      accept={
                        documentType === "pdf"
                          ? ".pdf"
                          : documentType === "docx"
                            ? ".docx"
                            : documentType === "xlsx"
                              ? ".xlsx"
                              : documentType === "pptx"
                                ? ".pptx"
                                : documentType === "html"
                                  ? ".html"
                                  : "*"
                      }
                      onChange={handleFileSelect}
                    />
                    {selectedFile && <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>}
                  </div>
                )}

                {documentType === "text" && (
                  <div className="space-y-2">
                    <Label>Text Content</Label>
                    <Textarea
                      placeholder="Enter your text content here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                )}

                {/* Parser Selection, Chunking Type, and Similarity Threshold - Side by Side */}
                {documentType && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Parser Selection */}
                    <div className="space-y-2">
                      <Label>Parser</Label>
                      <Select value={parserType} onValueChange={(value: ParserType) => setParserType(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parser" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentType !== "text" && <SelectItem value="kolosal">Kolosal Parse</SelectItem>}
                          {documentType !== "text" && <SelectItem value="markitdown">MarkItDown</SelectItem>}
                          {documentType !== "text" && (
                            <SelectItem value="docling" disabled>
                              Docling (Not supported yet)
                            </SelectItem>
                          )}
                          {documentType === "text" && <SelectItem value="none">No parsing needed</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Chunking Type */}
                    {parserType && (
                      <div className="space-y-2">
                        <Label>Chunking Type</Label>
                        <Select value={chunkingType} onValueChange={(value: ChunkingType) => setChunkingType(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select chunking type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="regular">Regular Chunking</SelectItem>
                            <SelectItem value="semantic">Semantic Chunking</SelectItem>
                            <SelectItem value="none">No Chunking</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Semantic Chunking Config */}
                    {chunkingType === "semantic" && (
                      <div className="space-y-2">
                        <Label>Similarity Threshold</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={similarityThreshold}
                          onChange={(e) => setSimilarityThreshold(Number.parseFloat(e.target.value))}
                        />
                        <p className="text-xs text-gray-500">Threshold for semantic similarity (0.0-1.0)</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Preprocess Button */}
                <Button onClick={handlePreprocessDocuments} disabled={isProcessing} className="w-full">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Preprocess Documents"
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

            {/* Success Display */}
            {success && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium">Success</span>
                  </div>
                  <p className="text-green-600 mt-1">{success}</p>
                </CardContent>
              </Card>
            )}

            {/* Document Review Section */}
            {(originalText || chunkedDocuments.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original Document */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      Original Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 border max-h-96 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{originalText}</pre>
                    </div>
                    {parsedDocument && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm">
                          <strong>Filename:</strong> {parsedDocument.filename}
                        </p>
                        <p className="text-sm">
                          <strong>Title:</strong> {parsedDocument.title}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Chunked Documents */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Chunked Documents ({chunkedDocuments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {chunkedDocuments.map((chunk) => (
                        <ChunkEditor
                          key={chunk.id}
                          chunk={chunk}
                          onDelete={() => handleDeleteChunk(chunk.id)}
                          onEdit={() => handleEditChunk(chunk.id)}
                          onSave={(text, metadata) => handleSaveChunk(chunk.id, text, metadata)}
                          onCancel={() => handleCancelEdit(chunk.id)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Add Documents Button */}
            {chunkedDocuments.length > 0 && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="pt-6">
                  <Button onClick={handleAddDocuments} disabled={isIngesting} className="w-full" size="lg">
                    {isIngesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Documents...
                      </>
                    ) : (
                      `Add ${chunkedDocuments.length} Documents to Collection`
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// Chunk Editor Component
interface ChunkEditorProps {
  chunk: ChunkedDocument
  onDelete: () => void
  onEdit: () => void
  onSave: (text: string, metadata: string) => void
  onCancel: () => void
}

function ChunkEditor({ chunk, onDelete, onEdit, onSave, onCancel }: ChunkEditorProps) {
  const [editText, setEditText] = useState(chunk.text)
  const [editMetadata, setEditMetadata] = useState(JSON.stringify(chunk.metadata, null, 2))

  const handleSave = () => {
    onSave(editText, editMetadata)
  }

  if (chunk.isEditing) {
    return (
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Text Content</Label>
            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="mt-1 min-h-[100px]" />
          </div>
          <div>
            <Label className="text-sm font-medium">Metadata (JSON)</Label>
            <Textarea
              value={editMetadata}
              onChange={(e) => setEditMetadata(e.target.value)}
              className="mt-1 min-h-[80px] font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <Badge variant="secondary" className="text-xs">
          {chunk.id}
        </Badge>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 bg-transparent"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="bg-white rounded p-3 border text-sm">
        <p className="whitespace-pre-wrap">{chunk.text}</p>
      </div>
      <div className="mt-2">
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Metadata</summary>
          <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(chunk.metadata, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}
