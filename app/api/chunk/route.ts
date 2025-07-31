import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi, apiConfig } from '@/lib/api-config'

export async function POST(request: NextRequest) {
  try {
    const { text, method, similarity_threshold } = await request.json()

    if (!text || !method) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const payload: any = {
      text: text,
      model_name: apiConfig.models.embedding,
      method: method,
    }

    if (method === "semantic" && similarity_threshold) {
      payload.similarity_threshold = similarity_threshold
    }

    const response = await fetch(kolosalApi.url('chunking'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Failed to chunk document: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json({
      chunks: result.chunks || [text]
    })

  } catch (error) {
    console.error("Chunk API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to chunk document' },
      { status: 500 }
    )
  }
}
