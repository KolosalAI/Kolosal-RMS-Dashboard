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
      // According to the API docs, arrays should be sent as multiple parameters with the same name
      parseFormData.append("to_formats", "md")
      parseFormData.append("to_formats", "json")
      parseFormData.append("do_ocr", "true")
      parseFormData.append("do_table_structure", "true")
      parseFormData.append("include_images", "true")
      parseFormData.append("table_mode", "accurate")
      parseFormData.append("pdf_backend", "dlparse_v4")
      parseFormData.append("image_export_mode", "embedded")
      parseFormData.append("target_type", "inbody")

      const endpoint = doclingApi.url('processFile')
      console.log("Docling endpoint:", endpoint)
      
      // Debug: Log the form data being sent
      console.log("Docling FormData parameters:");
      for (const [key, value] of parseFormData.entries()) {
        console.log(`  ${key}: ${typeof value === 'object' && value.constructor.name === 'File' ? `[File: ${value.name}]` : value}`);
      }
      
      const response = await fetch(endpoint, {
        method: "POST",
        body: parseFormData,
      })

      if (!response.ok) {
        // Try to get more detailed error information from the response
        let errorMessage = `Failed to parse with Docling: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
          }
        } catch (e) {
          // If we can't parse the error response, just use the status text
        }
        console.error("Docling API error:", errorMessage);
        throw new Error(errorMessage);
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
