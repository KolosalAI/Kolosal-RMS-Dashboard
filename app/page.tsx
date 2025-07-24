"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Activity, Brain, Cpu, FileText, Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

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

export default function Dashboard() {
  const [inferenceStatus, setInferenceStatus] = useState<InferenceStatus | null>(null)
  const [markitdownStatus, setMarkitdownStatus] = useState<ServiceStatus | null>(null)
  const [doclingStatus, setDoclingStatus] = useState<ServiceStatus | null>(null)
  const [documentsData, setDocumentsData] = useState<DocumentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchStatuses = async () => {
    console.log("Starting fetchStatuses...")
    setLoading(true)
    try {
      // Fetch inference server status (port 8084) - used for LLM, Embedding, and Kolosal Parser
      try {
        console.log("Fetching inference status from: http://127.0.0.1:8084/status")
        const inferenceRes = await fetch("http://127.0.0.1:8084/status")
        console.log("Inference response status:", inferenceRes.status)
        if (inferenceRes.ok) {
          const data = await inferenceRes.json()
          console.log("Inference status response:", data)
          setInferenceStatus(data)
        } else {
          console.error("Inference status failed:", inferenceRes.status, inferenceRes.statusText)
          setInferenceStatus({ status: "unavailable" } as InferenceStatus)
        }
      } catch (error) {
        console.error("Failed to fetch inference status:", error)
        setInferenceStatus({ status: "unavailable" } as InferenceStatus)
      }

      // Fetch markitdown status
      try {
        const markitdownRes = await fetch("http://127.0.0.1:8081/health")
        if (markitdownRes.ok) {
          const data = await markitdownRes.json()
          console.log("Markitdown status response:", data)
          setMarkitdownStatus(data)
        } else {
          console.error("Markitdown status failed:", markitdownRes.status, markitdownRes.statusText)
          setMarkitdownStatus({ status: "unavailable", service: "markitdown-api" })
        }
      } catch (error) {
        console.error("Failed to fetch markitdown status:", error)
        setMarkitdownStatus({ status: "unavailable", service: "markitdown-api" })
      }

      // Fetch docling status
      try {
        const doclingRes = await fetch("http://127.0.0.1:8082/health")
        if (doclingRes.ok) {
          const data = await doclingRes.json()
          console.log("Docling status response:", data)
          setDoclingStatus(data)
        } else {
          console.error("Docling status failed:", doclingRes.status, doclingRes.statusText)
          setDoclingStatus({ status: "unavailable", service: "docling-api" })
        }
      } catch (error) {
        console.error("Failed to fetch docling status:", error)
        setDoclingStatus({ status: "unavailable", service: "docling-api" })
      }

      // Fetch documents data
      try {
        const documentsRes = await fetch("http://127.0.0.1:8084/list_documents")
        if (documentsRes.ok) {
          const data = await documentsRes.json()
          console.log("Documents response:", data)
          setDocumentsData(data)
        } else {
          console.error("Documents fetch failed:", documentsRes.status, documentsRes.statusText)
          setDocumentsData(null)
        }
      } catch (error) {
        console.error("Failed to fetch documents data:", error)
        setDocumentsData(null)
      }

      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatuses()
    const interval = setInterval(fetchStatuses, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

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
    return inferenceStatus?.engines?.filter((engine) => !engine.engine_id.includes("embedding")) || []
  }

  const getEmbeddingEngines = () => {
    return inferenceStatus?.engines?.filter((engine) => engine.engine_id.includes("embedding")) || []
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Dashboard</h1>
                <p className="text-sm text-gray-500">Monitor the health and status of all system components</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</div>
              <Button onClick={fetchStatuses} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
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
                  {getLLMEngines().map((engine) => (
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
                  {getEmbeddingEngines().map((engine) => (
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
