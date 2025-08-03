import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi, markitdownApi, doclingApi, apiConfig } from '@/lib/api-config'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const parserType = formData.get('parserType') as string

    if (!file || !documentType || !parserType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let parsedText = ""
    let parsedMetadata = {}

    if (parserType === "kolosal") {
      const arrayBuffer = await file.arrayBuffer()
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      const endpoint = documentType === "pdf" ? kolosalApi.url('parsePdf') : kolosalApi.customUrl(`/parse_${documentType}`)
      const response = await fetch(endpoint, {
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
      parsedText = result.text || result.content || JSON.stringify(result)
    } else if (parserType === "markitdown") {
      const parseFormData = new FormData()
      parseFormData.append("file", file)

      const endpoint = markitdownApi.customUrl(`/parse_${documentType}`)
      const response = await fetch(endpoint, {
        method: "POST",
        body: parseFormData,
      })

      if (!response.ok) {
        throw new Error(`Failed to parse with MarkItDown: ${response.statusText}`)
      }

      const result = await response.json()
      parsedText = result.markdown_content
      parsedMetadata = result.metadata
    } else if (parserType === "docling") {
      // Docling integration - Advanced document parsing with OCR and table structure recognition
      // Uses Docling API v1.1.0 for high-quality document conversion to Markdown
      console.log("Parsing with Docling for file:", file.name)
      
      const parseFormData = new FormData()
      parseFormData.append("files", file)
      
      // Set Docling-specific parameters for optimal parsing
      parseFormData.append("to_formats", JSON.stringify(["md", "json"]))
      parseFormData.append("do_ocr", "true")
      parseFormData.append("do_table_structure", "true")
      parseFormData.append("include_images", "true")
      parseFormData.append("table_mode", "accurate")
      parseFormData.append("pdf_backend", "dlparse_v4")
      parseFormData.append("image_export_mode", "embedded")

      const endpoint = doclingApi.url('processFile')
      console.log("Docling endpoint:", endpoint)
      
      const response = await fetch(endpoint, {
        method: "POST",
        body: parseFormData,
      })

      if (!response.ok) {
        throw new Error(`Failed to parse with Docling: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Docling response:", { status: result.status, hasDocument: !!result.document })
      
      // Handle Docling response format
      if (result.document) {
        parsedText = result.document.md_content || result.document.text_content || ""
        parsedMetadata = {
          filename: result.document.filename || file.name,
          processing_time: result.processing_time,
          status: result.status,
          timings: result.timings,
          ...(result.document.json_content?.metadata || {})
        }
        console.log("Parsed text length:", parsedText.length)
      } else if (result.status === "pending") {
        throw new Error("Docling parsing is still in progress. Please try again later.")
      } else {
        throw new Error(`Docling parsing failed with status: ${result.status || "unknown"}`)
      }
    } else {
      throw new Error("Unsupported parser type")
    }

    return NextResponse.json({
      text: parsedText,
      metadata: parsedMetadata,
      filename: file.name
    })

  } catch (error) {
    console.error("Parse API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse document' },
      { status: 500 }
    )
  }
}
