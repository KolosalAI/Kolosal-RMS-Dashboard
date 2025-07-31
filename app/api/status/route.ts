import { NextRequest, NextResponse } from 'next/server'
import { kolosalApi, markitdownApi, doclingApi } from '@/lib/api-config'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface EngineStatus {
  engine_id: string
  status: string
}

interface InferenceStatus {
  engines: EngineStatus[]
  node_manager: {
    autoscaling: string
    loaded_engines: number
    total_engines: number
    unloaded_engines: number
  }
  server: {
    name: string
    uptime: string
    version: string
  }
  status: string
  timestamp: number
}

interface ServiceStatus {
  status: string
  service: string
}

interface DocumentsResponse {
  collection_name: string
  document_ids: string[]
  total_count: number
}

interface DashboardData {
  inferenceStatus: InferenceStatus | null
  markitdownStatus: ServiceStatus | null
  doclingStatus: ServiceStatus | null
  documentsData: DocumentsResponse | null
  lastUpdated: string
}

export async function GET(request: NextRequest) {
  console.log("API Route: Starting fetchStatuses...")
  
  try {
    const results = await Promise.allSettled([
      // Fetch inference server status (port 8084)
      fetch(kolosalApi.url('status')).then(async (res) => {
        if (res.ok) {
          return await res.json()
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }).catch(() => ({ status: "unavailable" })),

      // Fetch markitdown status
      fetch(markitdownApi.url('health')).then(async (res) => {
        if (res.ok) {
          return await res.json()
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }).catch(() => ({ status: "unavailable", service: "markitdown-api" })),

      // Fetch docling status
      fetch(doclingApi.url('health')).then(async (res) => {
        if (res.ok) {
          return await res.json()
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }).catch(() => ({ status: "unavailable", service: "docling-api" })),

      // Fetch documents data
      fetch(kolosalApi.url('listDocuments')).then(async (res) => {
        if (res.ok) {
          return await res.json()
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }).catch(() => null)
    ])

    const dashboardData: DashboardData = {
      inferenceStatus: results[0].status === 'fulfilled' ? results[0].value : null,
      markitdownStatus: results[1].status === 'fulfilled' ? results[1].value : null,
      doclingStatus: results[2].status === 'fulfilled' ? results[2].value : null,
      documentsData: results[3].status === 'fulfilled' ? results[3].value : null,
      lastUpdated: new Date().toISOString()
    }

    console.log("API Route: Successfully fetched all statuses")
    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("API Route: Failed to fetch statuses:", error)
    return NextResponse.json(
      { error: "Failed to fetch status data" },
      { status: 500 }
    )
  }
}
