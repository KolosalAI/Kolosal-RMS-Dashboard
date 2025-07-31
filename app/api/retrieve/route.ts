import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi } from '@/lib/api-config'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { query, limit, score_threshold } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    const response = await fetch(kolosalApi.url('retrieve'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        limit: limit || 10,
        score_threshold: score_threshold || 0.5
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to retrieve documents: ${response.statusText}`)
    }

    const result = await response.json()
    const endTime = Date.now()
    
    return NextResponse.json({
      documents: result.documents || [],
      query,
      total_results: result.documents?.length || 0,
      elapsed_time: endTime - startTime
    })

  } catch (error) {
    console.error("Retrieve API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve documents' },
      { status: 500 }
    )
  }
}
