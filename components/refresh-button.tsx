"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

interface RefreshButtonProps {
  lastUpdated: string
}

export function RefreshButton({ lastUpdated }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setLoading(true)
    try {
      // Force a refresh of the page data
      router.refresh()
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm text-gray-500">
        Last updated: {new Date(lastUpdated).toLocaleTimeString()}
      </div>
      <Button onClick={handleRefresh} disabled={loading} variant="outline" size="sm">
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  )
}
