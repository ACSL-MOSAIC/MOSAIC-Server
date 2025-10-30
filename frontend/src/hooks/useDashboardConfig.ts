import {
  readDashboardApi,
  upsertDashboardApi,
} from "@/client/service/dashboard.api.ts"
import type { DashboardConfig } from "@/components/Dashboard/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { v4 as uuidv4 } from "uuid"

// 기본 대시보드 설정 생성
const createDefaultDashboardConfig = (): DashboardConfig => {
  const defaultTab = {
    id: uuidv4(),
    name: "Default",
    widgets: [],
  }

  return {
    userId: "",
    tabs: [defaultTab],
    activeTabId: defaultTab.id,
  }
}

// 대시보드 조회
export function useDashboardConfigQuery() {
  return useQuery({
    queryKey: ["dashboardConfig"],
    queryFn: async () => {
      try {
        const res = await readDashboardApi()
        return res.dashboard_config as unknown as DashboardConfig
      } catch (error: any) {
        // 404 에러인 경우 기본 설정 반환
        if (error.status === 404) {
          return createDefaultDashboardConfig()
        }
        throw error
      }
    },
  })
}

// 대시보드 저장
export function useDashboardConfigMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (config: DashboardConfig) => {
      await upsertDashboardApi({ dashboard_config: config as any })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardConfig"] })
    },
  })
}
