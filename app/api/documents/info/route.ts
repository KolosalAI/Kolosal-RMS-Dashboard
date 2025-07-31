import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi } from '@/lib/api-config'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { document_ids } = await request.json()

    if (!document_ids || !Array.isArray(document_ids)) {
      return NextResponse.json(
        { error: 'Document IDs array is required' },
        { status: 400 }
      )
    }

    const response = await fetch(kolosalApi.url('infoDocuments'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: document_ids }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch document info: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error("Document info API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch document info' },
      { status: 500 }
    )
  }
}
