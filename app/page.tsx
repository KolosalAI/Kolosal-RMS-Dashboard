import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Activity, Brain, Cpu, FileText, Database } from "lucide-react"
import { RefreshButton } from "@/components/refresh-button"
import { kolosalApi, markitdownApi, doclingApi } from "@/lib/api-config"

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

async function fetchStatuses() {
  console.log("Server: Starting fetchStatuses...")
  
  try {
    const results = await Promise.allSettled([
      // Fetch inference server status (port 8084)
      fetch(kolosalApi.url('status'), { 
        cache: 'no-store',
        next: { revalidate: 0 }
      }).then(async (res) => {
        console.log(`Server: Inference status response: ${res.status}`)
        if (res.ok) {
          const data = await res.json()
          console.log("Server: Inference status data:", data)
          return data
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }).catch((error) => {
        console.error("Server: Failed to fetch inference status:", error)
        return { status: "unavailable" }
      }),

      // Fetch markitdown status
      fetch(markitdownApi.url('health'), { 
        cache: 'no-store',
        next: { revalidate: 0 }
      }).then(async (res) => {
        console.log(`Server: Markitdown status response: ${res.status}`)
        if (res.ok) {
          const data = await res.json()
          console.log("Server: Markitdown status data:", data)
          return data
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }).catch((error) => {
        console.error("Server: Failed to fetch markitdown status:", error)
        return { status: "unavailable", service: "markitdown-api" }
      }),

      // Fetch docling status
      fetch(doclingApi.url('health'), { 
        cache: 'no-store',
        next: { revalidate: 0 }
      }).then(async (res) => {
        console.log(`Server: Docling status response: ${res.status}`)
        if (res.ok) {
          const data = await res.json()
          console.log("Server: Docling status data:", data)
          return data
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }).catch((error) => {
        console.error("Server: Failed to fetch docling status:", error)
        return { status: "unavailable", service: "docling-api" }
      }),

      // Fetch documents data
      fetch(kolosalApi.url('listDocuments'), { 
        cache: 'no-store',
        next: { revalidate: 0 }
      }).then(async (res) => {
        console.log(`Server: Documents status response: ${res.status}`)
        if (res.ok) {
          const data = await res.json()
          console.log("Server: Documents data:", data)
          return data
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }).catch((error) => {
        console.error("Server: Failed to fetch documents data:", error)
        return null
      })
    ])

    return {
      inferenceStatus: results[0].status === 'fulfilled' ? results[0].value : null,
      markitdownStatus: results[1].status === 'fulfilled' ? results[1].value : null,
      doclingStatus: results[2].status === 'fulfilled' ? results[2].value : null,
      documentsData: results[3].status === 'fulfilled' ? results[3].value : null,
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error("Server: Failed to fetch statuses:", error)
    return {
      inferenceStatus: null,
      markitdownStatus: null,
      doclingStatus: null,
      documentsData: null,
      lastUpdated: new Date().toISOString()
    }
  }
}

export default async function Dashboard() {
  const { inferenceStatus, markitdownStatus, doclingStatus, documentsData, lastUpdated } = await fetchStatuses()

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return "bg-red-500"
    if (status === "unavailable") return "bg-gray-400"
    return status === "healthy" || status === "loaded" ? "bg-green-500" : "bg-red-500"
  }

  const getEngineStatusColor = (status: string) => {
    if (status === "loaded") return "bg-green-500"
    if (status === "loading") return "bg-yellow-500"
    if (status === "unloaded") return "bg-gray-500"
    return "bg-red-500"
  }

  const getLLMEngines = () => {
    return inferenceStatus?.engines?.filter((engine: EngineStatus) => !engine.engine_id.includes("embedding")) || []
  }

  const getEmbeddingEngines = () => {
    return inferenceStatus?.engines?.filter((engine: EngineStatus) => engine.engine_id.includes("embedding")) || []
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Retrieval Management System Dashboard</h1>
                <p className="text-sm text-gray-500">Monitor the health and status of all system components</p>
              </div>
            </div>
            <RefreshButton lastUpdated={lastUpdated} />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* LLM Status */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-blue-600" />
                  LLM Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(inferenceStatus?.status)}`} />
                  <span className="font-medium">
                    {inferenceStatus?.status === "unavailable"
                      ? "Service Unavailable"
                      : inferenceStatus?.status || "Unknown"}
                  </span>
                </div>
                <div className="space-y-2">
                  {getLLMEngines().map((engine: EngineStatus) => (
                    <div key={engine.engine_id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate">{engine.engine_id}</span>
                      <Badge
                        variant="secondary"
                        className={`${getEngineStatusColor(engine.status)} text-white text-xs`}
                      >
                        {engine.status}
                      </Badge>
                    </div>
                  ))}
                  {getLLMEngines().length === 0 && <p className="text-sm text-gray-500">No LLM engines found</p>}
                </div>
              </CardContent>
            </Card>

            {/* Embedding Status */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Embedding Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(inferenceStatus?.status)}`} />
                  <span className="font-medium">
                    {inferenceStatus?.status === "unavailable"
                      ? "Service Unavailable"
                      : inferenceStatus?.status || "Unknown"}
                  </span>
                </div>
                <div className="space-y-2">
                  {getEmbeddingEngines().map((engine: EngineStatus) => (
                    <div key={engine.engine_id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate">{engine.engine_id}</span>
                      <Badge
                        variant="secondary"
                        className={`${getEngineStatusColor(engine.status)} text-white text-xs`}
                      >
                        {engine.status}
                      </Badge>
                    </div>
                  ))}
                  {getEmbeddingEngines().length === 0 && (
                    <p className="text-sm text-gray-500">No embedding engines found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Kolosal Parses Status */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cpu className="h-5 w-5 text-green-600" />
                  Kolosal Document Parser
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(inferenceStatus?.status)}`} />
                  <span className="font-medium">
                    {inferenceStatus?.status === "unavailable"
                      ? "Service Unavailable"
                      : inferenceStatus?.status || "Unknown"}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Service: kolosal-server</p>
                  <p>Port: 8084</p>
                </div>
              </CardContent>
            </Card>

            {/* Markitdown Status */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                  MarkItDown Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(markitdownStatus?.status)}`} />
                  <span className="font-medium">
                    {markitdownStatus?.status === "unavailable"
                      ? "Service Unavailable"
                      : markitdownStatus?.status || "Unknown"}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Service: {markitdownStatus?.service || "markitdown-api"}</p>
                  <p>Port: 8081</p>
                </div>
              </CardContent>
            </Card>

            {/* Docling Status */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Docling Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(doclingStatus?.status)}`} />
                  <span className="font-medium">
                    {doclingStatus?.status === "unavailable"
                      ? "Service Unavailable"
                      : doclingStatus?.status || "Unknown"}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Service: {doclingStatus?.service || "docling-api"}</p>
                  <p>Port: 8082</p>
                </div>
              </CardContent>
            </Card>

            {/* Document Chunks */}
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-teal-600" />
                  Document Chunks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${documentsData ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="font-medium">{documentsData ? "Connected" : "Disconnected"}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Collection: {documentsData?.collection_name || "Unknown"}</p>
                  <p className="font-medium text-gray-900">Total Documents: {documentsData?.total_count || 0}</p>
                  <p>Port: 8084</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
