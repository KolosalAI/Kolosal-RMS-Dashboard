"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, RefreshCw, Search, Loader2, AlertCircle, CheckCircle, Clock, Zap } from "lucide-react"

// Environment variables with fallback defaults - using proper client-side access
const HUGGINGFACE_API_URL = process.env.NEXT_PUBLIC_HUGGINGFACE_API_URL || "https://huggingface.co/api"

interface Engine {
    engine_id: string
    status: "loaded" | "unloaded"
}

interface ServerStatus {
    engines: Engine[]
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

interface HuggingFaceModel {
    id: string
    author: string
    downloads: number
    likes: number
    tags: string[]
    createdAt: string
    updatedAt: string
    private: boolean
    gated: boolean
}

interface ModelFile {
    path: string
    size: number
    type: string
}

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

export default function EngineConfigurationPage() {
    const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("llm")
    const [isAddModelOpen, setIsAddModelOpen] = useState(false)
    const [isHuggingFaceOpen, setIsHuggingFaceOpen] = useState(false)
    const [huggingFaceModels, setHuggingFaceModels] = useState<HuggingFaceModel[]>([])
    const [huggingFaceLoading, setHuggingFaceLoading] = useState(false)
    const [huggingFaceSearch, setHuggingFaceSearch] = useState("")
    const [selectedModel, setSelectedModel] = useState<HuggingFaceModel | null>(null)
    const [modelFiles, setModelFiles] = useState<ModelFile[]>([])
    const [selectedFile, setSelectedFile] = useState<string>("")
    const [addModelForm, setAddModelForm] = useState<AddModelForm>({
        model_id: "",
        model_path: "",
        model_type: "llm",
        inference_engine: "llama-cpu",
        main_gpu_id: -1,
        load_immediately: true,
        loading_parameters: {
            n_ctx: 4096,
            n_keep: 0,
            n_batch: 512,
            n_ubatch: 512,
            n_parallel: 1,
            n_gpu_layers: 0,
            use_mmap: true,
            use_mlock: false,
            cont_batching: false,
            warmup: true,
        },
    })

    useEffect(() => {
        fetchServerStatus()
    }, [])

    const fetchServerStatus = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/engines')
            if (!response.ok) {
                throw new Error("Failed to fetch server status")
            }
            const data = await response.json()
            setServerStatus(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch server status")
        } finally {
            setLoading(false)
        }
    }

    const searchHuggingFaceModels = async () => {
        try {
            setHuggingFaceLoading(true)
            const searchQuery = huggingFaceSearch || "kolosal"
            const response = await fetch(`${HUGGINGFACE_API_URL}/models?search=${searchQuery}&limit=50`)
            if (!response.ok) {
                throw new Error("Failed to search Hugging Face models")
            }
            const data = await response.json()
            setHuggingFaceModels(data)
        } catch (err) {
            console.error("Error searching Hugging Face models:", err)
        } finally {
            setHuggingFaceLoading(false)
        }
    }

    const fetchModelFiles = async (modelId: string) => {
        try {
            const response = await fetch(`${HUGGINGFACE_API_URL}/models/${modelId}/tree/main`)
            if (!response.ok) {
                throw new Error("Failed to fetch model files")
            }
            const data = await response.json()
            const ggufFiles = data.filter((file: any) => file.path.endsWith(".gguf"))
            setModelFiles(ggufFiles)
        } catch (err) {
            console.error("Error fetching model files:", err)
            setModelFiles([])
        }
    }

    const selectHuggingFaceModel = async (model: HuggingFaceModel) => {
        setSelectedModel(model)
        await fetchModelFiles(model.id)

        // Auto-detect model type based on name/tags
        const isEmbedding =
            model.id.toLowerCase().includes("embedding") || model.tags.some((tag) => tag.toLowerCase().includes("embedding"))

        setAddModelForm((prev) => ({
            ...prev,
            model_id: model.id.replace("/", "_"),
            model_type: isEmbedding ? "embedding" : "llm",
        }))
    }

    const selectModelFile = (filePath: string) => {
        setSelectedFile(filePath)
        const downloadUrl = `https://huggingface.co/${selectedModel?.id}/resolve/main/${filePath}`
        setAddModelForm((prev) => ({
            ...prev,
            model_path: downloadUrl,
        }))
    }

    const removeEngine = async (engineId: string) => {
        if (!confirm(`Are you sure you want to remove engine "${engineId}"?`)) {
            return
        }

        try {
            const response = await fetch(`/api/engines/${encodeURIComponent(engineId)}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("Failed to remove engine")
            }

            await fetchServerStatus()
        } catch (err) {
            alert(`Failed to remove engine: ${err instanceof Error ? err.message : "Unknown error"}`)
        }
    }

    const addModel = async () => {
        try {
            const response = await fetch('/api/engines', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(addModelForm),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to add model")
            }

            const result = await response.json()

            if (result.status === "downloading") {
                alert(`Model download started: ${result.model_id}. Check downloads for progress.`)
            } else {
                alert(`Model added successfully: ${result.model_id}`)
            }

            setIsAddModelOpen(false)
            setIsHuggingFaceOpen(false)
            await fetchServerStatus()

            // Reset form
            setAddModelForm({
                model_id: "",
                model_path: "",
                model_type: "llm",
                inference_engine: "llama-cpu",
                main_gpu_id: -1,
                load_immediately: true,
                loading_parameters: {
                    n_ctx: 4096,
                    n_keep: 0,
                    n_batch: 512,
                    n_ubatch: 512,
                    n_parallel: 1,
                    n_gpu_layers: 0,
                    use_mmap: true,
                    use_mlock: false,
                    cont_batching: false,
                    warmup: true,
                },
            })
            setSelectedModel(null)
            setModelFiles([])
            setSelectedFile("")
        } catch (err) {
            alert(`Failed to add model: ${err instanceof Error ? err.message : "Unknown error"}`)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "loaded":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "unloaded":
                return <Clock className="h-4 w-4 text-yellow-500" />
            default:
                return <AlertCircle className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "loaded":
                return (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                        Loaded
                    </Badge>
                )
            case "unloaded":
                return (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Unloaded
                    </Badge>
                )
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    const isEmbeddingModel = (engineId: string) => {
        return /embedding/i.test(engineId)
    }

    const llmEngines = serverStatus?.engines.filter((engine) => !isEmbeddingModel(engine.engine_id)) || []
    const embeddingEngines = serverStatus?.engines.filter((engine) => isEmbeddingModel(engine.engine_id)) || []

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <div className="flex-1 flex flex-col">
                    <header className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Engine Configuration</h1>
                                <p className="text-sm text-gray-500">Manage LLM and Embedding models</p>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading engine configuration...</span>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <div className="flex-1 flex flex-col">
                    <header className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Engine Configuration</h1>
                                <p className="text-sm text-gray-500">Manage LLM and Embedding models</p>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 flex items-center justify-center">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="h-5 w-5" />
                                    Error
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">{error}</p>
                                <Button onClick={fetchServerStatus} className="w-full">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retry
                                </Button>
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="flex-1 flex flex-col">
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Engine Configuration</h1>
                                <p className="text-sm text-gray-500">Manage LLM and Embedding models</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={fetchServerStatus} variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh
                            </Button>
                            <Dialog open={isHuggingFaceOpen} onOpenChange={setIsHuggingFaceOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Search className="h-4 w-4 mr-2" />
                                        Browse Hugging Face
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Browse Hugging Face Models</DialogTitle>
                                        <DialogDescription>
                                            Search and select models from Hugging Face to add to your engine configuration
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Search models (e.g., kolosal, embedding, llama)..."
                                                value={huggingFaceSearch}
                                                onChange={(e) => setHuggingFaceSearch(e.target.value)}
                                                onKeyPress={(e) => e.key === "Enter" && searchHuggingFaceModels()}
                                            />
                                            <Button onClick={searchHuggingFaceModels} disabled={huggingFaceLoading}>
                                                {huggingFaceLoading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Search className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>

                                        {selectedModel && (
                                            <Card className="border-blue-200 bg-blue-50">
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Selected: {selectedModel.id}</CardTitle>
                                                    <CardDescription>
                                                        {selectedModel.downloads.toLocaleString()} downloads • {selectedModel.likes} likes
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label>Available GGUF Files:</Label>
                                                            <div className="grid gap-2 mt-2">
                                                                {modelFiles.length === 0 ? (
                                                                    <p className="text-sm text-gray-500">No GGUF files found</p>
                                                                ) : (
                                                                    modelFiles.map((file) => (
                                                                        <div
                                                                            key={file.path}
                                                                            className={`p-3 border rounded cursor-pointer transition-colors ${selectedFile === file.path
                                                                                ? "border-blue-500 bg-blue-50"
                                                                                : "border-gray-200 hover:border-gray-300"
                                                                                }`}
                                                                            onClick={() => selectModelFile(file.path)}
                                                                        >
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="font-medium">{file.path}</span>
                                                                                <span className="text-sm text-gray-500">
                                                                                    {(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        <div className="grid gap-4 max-h-96 overflow-y-auto">
                                            {huggingFaceModels.map((model) => (
                                                <Card
                                                    key={model.id}
                                                    className={`cursor-pointer transition-colors ${selectedModel?.id === model.id ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"
                                                        }`}
                                                    onClick={() => selectHuggingFaceModel(model)}
                                                >
                                                    <CardHeader className="pb-2">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <CardTitle className="text-base">{model.id}</CardTitle>
                                                                <CardDescription>by {model.author}</CardDescription>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                {isEmbeddingModel(model.id) && <Badge variant="secondary">Embedding</Badge>}
                                                                {model.gated && <Badge variant="outline">Gated</Badge>}
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        <div className="flex justify-between text-sm text-gray-600">
                                                            <span>{model.downloads.toLocaleString()} downloads</span>
                                                            <span>{model.likes} likes</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {model.tags.slice(0, 3).map((tag) => (
                                                                <Badge key={tag} variant="outline" className="text-xs">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsHuggingFaceOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setIsHuggingFaceOpen(false)
                                                setIsAddModelOpen(true)
                                            }}
                                            disabled={!selectedModel || !selectedFile}
                                        >
                                            Use Selected Model
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Dialog open={isAddModelOpen} onOpenChange={setIsAddModelOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Model
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Add New Model</DialogTitle>
                                        <DialogDescription>Configure and add a new AI model to the engine</DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="model-id">Model ID *</Label>
                                                <Input
                                                    id="model-id"
                                                    value={addModelForm.model_id}
                                                    onChange={(e) => setAddModelForm((prev) => ({ ...prev, model_id: e.target.value }))}
                                                    placeholder="e.g., llama-2-7b-chat"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="model-type">Model Type *</Label>
                                                <Select
                                                    value={addModelForm.model_type}
                                                    onValueChange={(value: "llm" | "embedding") =>
                                                        setAddModelForm((prev) => ({ ...prev, model_type: value }))
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="llm">LLM (Text Generation)</SelectItem>
                                                        <SelectItem value="embedding">Embedding (Text Vectorization)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="model-path">Model Path/URL *</Label>
                                            <Textarea
                                                id="model-path"
                                                value={addModelForm.model_path}
                                                onChange={(e) => setAddModelForm((prev) => ({ ...prev, model_path: e.target.value }))}
                                                placeholder="./models/model.gguf or https://huggingface.co/..."
                                                rows={2}
                                            />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="inference-engine">Inference Engine</Label>
                                                <Select
                                                    value={addModelForm.inference_engine}
                                                    onValueChange={(value) => setAddModelForm((prev) => ({ ...prev, inference_engine: value }))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="llama-cpu">llama-cpu</SelectItem>
                                                        <SelectItem value="llama-gpu">llama-gpu</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="main-gpu-id">Main GPU ID</Label>
                                                <Input
                                                    id="main-gpu-id"
                                                    type="number"
                                                    value={addModelForm.main_gpu_id}
                                                    onChange={(e) =>
                                                        setAddModelForm((prev) => ({ ...prev, main_gpu_id: Number.parseInt(e.target.value) }))
                                                    }
                                                    min="-1"
                                                    max="7"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2 pt-6">
                                                <Checkbox
                                                    id="load-immediately"
                                                    checked={addModelForm.load_immediately}
                                                    onCheckedChange={(checked) =>
                                                        setAddModelForm((prev) => ({ ...prev, load_immediately: checked as boolean }))
                                                    }
                                                />
                                                <Label htmlFor="load-immediately">Load Immediately</Label>
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <h4 className="font-medium mb-3">Loading Parameters</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="n-ctx">Context Size</Label>
                                                    <Input
                                                        id="n-ctx"
                                                        type="number"
                                                        value={addModelForm.loading_parameters.n_ctx}
                                                        onChange={(e) =>
                                                            setAddModelForm((prev) => ({
                                                                ...prev,
                                                                loading_parameters: {
                                                                    ...prev.loading_parameters,
                                                                    n_ctx: Number.parseInt(e.target.value),
                                                                },
                                                            }))
                                                        }
                                                        min="1"
                                                        max="32768"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="n-batch">Batch Size</Label>
                                                    <Input
                                                        id="n-batch"
                                                        type="number"
                                                        value={addModelForm.loading_parameters.n_batch}
                                                        onChange={(e) =>
                                                            setAddModelForm((prev) => ({
                                                                ...prev,
                                                                loading_parameters: {
                                                                    ...prev.loading_parameters,
                                                                    n_batch: Number.parseInt(e.target.value),
                                                                },
                                                            }))
                                                        }
                                                        min="1"
                                                        max="4096"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="n-gpu-layers">GPU Layers</Label>
                                                    <Input
                                                        id="n-gpu-layers"
                                                        type="number"
                                                        value={addModelForm.loading_parameters.n_gpu_layers}
                                                        onChange={(e) =>
                                                            setAddModelForm((prev) => ({
                                                                ...prev,
                                                                loading_parameters: {
                                                                    ...prev.loading_parameters,
                                                                    n_gpu_layers: Number.parseInt(e.target.value),
                                                                },
                                                            }))
                                                        }
                                                        min="0"
                                                        max="100"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="n-parallel">Parallel Sequences</Label>
                                                    <Input
                                                        id="n-parallel"
                                                        type="number"
                                                        value={addModelForm.loading_parameters.n_parallel}
                                                        onChange={(e) =>
                                                            setAddModelForm((prev) => ({
                                                                ...prev,
                                                                loading_parameters: {
                                                                    ...prev.loading_parameters,
                                                                    n_parallel: Number.parseInt(e.target.value),
                                                                },
                                                            }))
                                                        }
                                                        min="1"
                                                        max="16"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="use-mmap"
                                                        checked={addModelForm.loading_parameters.use_mmap}
                                                        onCheckedChange={(checked) =>
                                                            setAddModelForm((prev) => ({
                                                                ...prev,
                                                                loading_parameters: { ...prev.loading_parameters, use_mmap: checked as boolean },
                                                            }))
                                                        }
                                                    />
                                                    <Label htmlFor="use-mmap">Use Memory Mapping</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="warmup"
                                                        checked={addModelForm.loading_parameters.warmup}
                                                        onCheckedChange={(checked) =>
                                                            setAddModelForm((prev) => ({
                                                                ...prev,
                                                                loading_parameters: { ...prev.loading_parameters, warmup: checked as boolean },
                                                            }))
                                                        }
                                                    />
                                                    <Label htmlFor="warmup">Perform Warmup</Label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsAddModelOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={addModel} disabled={!addModelForm.model_id || !addModelForm.model_path}>
                                            Add Model
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    {/* Server Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Engines</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{serverStatus?.node_manager.total_engines || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Loaded Engines</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {serverStatus?.node_manager.loaded_engines || 0}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Unloaded Engines</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {serverStatus?.node_manager.unloaded_engines || 0}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Autoscaling</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium capitalize">{serverStatus?.node_manager.autoscaling || "Unknown"}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Engine Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="llm">LLM Models ({llmEngines.length})</TabsTrigger>
                            <TabsTrigger value="embedding">Embedding Models ({embeddingEngines.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="llm" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Large Language Models</CardTitle>
                                    <CardDescription>
                                        Models for text generation, chat completion, and instruction following
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {llmEngines.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No LLM engines found</p>
                                            <p className="text-sm">Add your first LLM model to get started</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {llmEngines.map((engine) => (
                                                <div key={engine.engine_id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        {getStatusIcon(engine.status)}
                                                        <div>
                                                            <h4 className="font-medium">{engine.engine_id}</h4>
                                                            <p className="text-sm text-gray-600">LLM Engine</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(engine.status)}
                                                        <Button variant="outline" size="sm" onClick={() => removeEngine(engine.engine_id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="embedding" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Embedding Models</CardTitle>
                                    <CardDescription>
                                        Models for text vectorization, semantic search, and similarity computation
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {embeddingEngines.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>No embedding engines found</p>
                                            <p className="text-sm">Add your first embedding model to get started</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {embeddingEngines.map((engine) => (
                                                <div key={engine.engine_id} className="flex items-center justify-between p-4 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        {getStatusIcon(engine.status)}
                                                        <div>
                                                            <h4 className="font-medium">{engine.engine_id}</h4>
                                                            <p className="text-sm text-gray-600">Embedding Engine</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(engine.status)}
                                                        <Button variant="outline" size="sm" onClick={() => removeEngine(engine.engine_id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    )
}
