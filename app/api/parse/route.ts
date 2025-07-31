import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi, markitdownApi, apiConfig } from '@/lib/api-config'

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
