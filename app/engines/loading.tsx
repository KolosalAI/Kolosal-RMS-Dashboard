import { Loader2 } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default function Loading() {
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
