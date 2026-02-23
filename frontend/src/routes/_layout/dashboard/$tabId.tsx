import DashboardGrid from "@/components/Dashboard/DashboardGrid.tsx"
import { DASHBOARD_STORAGE_KEYS } from "@/utils"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_layout/dashboard/$tabId")({
  component: Index,
})

function Index() {
  const { tabId } = Route.useParams()

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    window.localStorage.setItem(DASHBOARD_STORAGE_KEYS.lastTabId, tabId)
    window.localStorage.removeItem(DASHBOARD_STORAGE_KEYS.forceConfig)
  }, [tabId])

  return <DashboardGrid tabId={tabId} />
}
