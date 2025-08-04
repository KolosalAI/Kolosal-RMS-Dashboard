import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi } from '@/lib/api-config'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    engineId: string
  }
}

// DELETE /api/engines/[engineId] - Remove engine
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { engineId } = context.params
    console.log('API: Removing engine:', engineId)
    
    const response = await fetch(kolosalApi.customUrl(`/models/${encodeURIComponent(engineId)}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`API: Failed to remove engine: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to remove engine: ${response.statusText}` },
        { status: response.status }
      )
    }

    console.log('API: Engine removed successfully:', engineId)
    return NextResponse.json({ success: true, message: 'Engine removed successfully' })
  } catch (error) {
    console.error('API: Error removing engine:', error)
    return NextResponse.json(
      { error: 'Failed to remove engine' },
      { status: 500 }
    )
  }
}
