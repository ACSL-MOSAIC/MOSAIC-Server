import DashboardGrid from "@/components/Dashboard/DashboardGrid.tsx"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/dashboard/$tabId")({
  component: Index,
})

function Index() {
  const { tabId } = Route.useParams()
  return <DashboardGrid tabId={tabId} />
}
