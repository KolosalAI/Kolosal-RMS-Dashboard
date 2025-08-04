import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi } from '@/lib/api-config'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface AddModelForm {
  model_id: string
  model_path: string
  model_type: "llm" | "embedding"
  inference_engine: string
  main_gpu_id: number
  load_immediately: boolean
  loading_parameters: {
    n_ctx: number
    n_keep: number
    n_batch: number
    n_ubatch: number
    n_parallel: number
    n_gpu_layers: number
    use_mmap: boolean
    use_mlock: boolean
    cont_batching: boolean
    warmup: boolean
  }
}

// GET /api/engines - Get all engines status
export async function GET() {
  try {
    console.log('API: Fetching engines status from:', kolosalApi.url('status'))
    
    const response = await fetch(kolosalApi.url('status'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache busting
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error(`API: Failed to fetch engines status: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Failed to fetch engines status: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('API: Engines status fetched successfully')
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API: Error fetching engines status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch engines status' },
      { status: 500 }
    )
  }
}

// POST /api/engines - Add new model
export async function POST(request: NextRequest) {
  try {
    const body: AddModelForm = await request.json()
    console.log('API: Adding new model:', body.model_id)
    
    const response = await fetch(kolosalApi.url('models'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
      console.error(`API: Failed to add model: ${response.status} ${response.statusText}`, errorData)
      return NextResponse.json(
        { error: errorData.error?.message || `Failed to add model: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('API: Model added successfully:', data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API: Error adding model:', error)
    return NextResponse.json(
      { error: 'Failed to add model' },
      { status: 500 }
    )
  }
}
