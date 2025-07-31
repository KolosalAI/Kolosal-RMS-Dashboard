import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi } from '@/lib/api-config'

export async function DELETE(request: NextRequest) {
  try {
    const { document_ids } = await request.json()

    if (!document_ids || !Array.isArray(document_ids)) {
      return NextResponse.json(
        { error: 'Document IDs array is required' },
        { status: 400 }
      )
    }

    const response = await fetch(kolosalApi.url('removeDocuments'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids }),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete documents: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error("Delete documents API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete documents' },
      { status: 500 }
    )
  }
}
