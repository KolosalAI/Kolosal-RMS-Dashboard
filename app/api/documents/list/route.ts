import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi } from '@/lib/api-config'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(kolosalApi.url('listDocuments'), {
      cache: 'no-store',
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch document list: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error("List documents API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch document list' },
      { status: 500 }
    )
  }
}
