import DashboardGrid from "@/components/Dashboard/DashboardGrid.tsx"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/_layout/dashboard/$tabId")({
  component: Index,
})

const LAST_DASHBOARD_TAB_ID_STORAGE_KEY = "dashboard:lastTabId"

function Index() {
  const { tabId } = Route.useParams()

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    window.localStorage.setItem(LAST_DASHBOARD_TAB_ID_STORAGE_KEY, tabId)
  }, [tabId])

  return <DashboardGrid tabId={tabId} />
}
