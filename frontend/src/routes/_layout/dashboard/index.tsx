import { getTabListApi } from "@/client/service/dashboard.api.ts"
import useAuth from "@/hooks/useAuth.ts"
import { Container, HStack, Spinner, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/dashboard/")({
  component: DashboardEntryPage,
})

const LAST_DASHBOARD_TAB_ID_STORAGE_KEY = "dashboard:lastTabId"
const DASHBOARD_FORCE_CONFIG_STORAGE_KEY = "dashboard:forceConfig"

function DashboardEntryPage() {
  const { user } = useAuth()
  const { data: tabs = [], isLoading: isTabsLoading } = useQuery({
    queryKey: ["dashboardTabs"],
    queryFn: getTabListApi,
    enabled: !!user,
  })

  if (!user) {
    return <Navigate to="/dashboard/config" />
  }

  if (isTabsLoading) {
    return (
      <Container maxW="full" py={8}>
        <HStack gap={3}>
          <Spinner size="sm" />
          <Text>Loading dashboard tabs...</Text>
        </HStack>
      </Container>
    )
  }

  if (tabs.length === 0) {
    return <Navigate to="/dashboard/config" />
  }

  const shouldForceConfig =
    typeof window !== "undefined" &&
    window.localStorage.getItem(DASHBOARD_FORCE_CONFIG_STORAGE_KEY) === "1"
  if (shouldForceConfig) {
    window.localStorage.removeItem(DASHBOARD_FORCE_CONFIG_STORAGE_KEY)
    return <Navigate to="/dashboard/config" />
  }

  const savedTabId =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(LAST_DASHBOARD_TAB_ID_STORAGE_KEY)
  if (savedTabId && tabs.some((tab) => tab.id === savedTabId)) {
    return <Navigate to="/dashboard/$tabId" params={{ tabId: savedTabId }} />
  }

  return <Navigate to="/dashboard/config" />
}
