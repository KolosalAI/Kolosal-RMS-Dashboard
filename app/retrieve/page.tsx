import { SidebarTrigger } from "@/components/ui/sidebar"
import RetrieveClient from "@/components/retrieve-client"

export default function RetrievePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Retrieve Documents</h1>
              <p className="text-sm text-gray-500">Search and retrieve documents from the collection</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <RetrieveClient />
        </main>
      </div>
    </div>
  )
}
