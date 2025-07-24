import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Construction } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
              <p className="text-sm text-gray-500">System documentation and user guides</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-xl">
                <Construction className="h-6 w-6 text-yellow-600" />
                Work in Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Documentation section is currently under development.</p>
              <p className="text-sm text-gray-500">
                This section will contain comprehensive guides and API documentation for the system.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
