import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi } from '@/lib/api-config'

export async function POST(request: NextRequest) {
  try {
    const { documents } = await request.json()

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'Documents array is required' },
        { status: 400 }
      )
    }

    const response = await fetch(kolosalApi.url('addDocuments'), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents }),
    })

    if (!response.ok) {
      throw new Error(`Failed to add documents: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error("Add documents API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add documents' },
      { status: 500 }
    )
  }
}
