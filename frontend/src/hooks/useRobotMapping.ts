import { readRobotsApi } from "@/client/service/robot.api.ts"
import { useQuery } from "@tanstack/react-query"

export function useRobotMapping() {
  const {
    data: robotsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["robots"],
    queryFn: () => readRobotsApi(1000),
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  })

  const robots = robotsResponse?.data || []

  // ID를 이름으로 매핑하는 함수
  const getRobotName = (robotId: string): string => {
    const robot = robots.find((r) => r.id === robotId)
    return robot ? robot.name : `로봇 ${robotId.slice(0, 8)}...`
  }

  // ID를 로봇 객체로 매핑하는 함수
  const getRobot = (robotId: string) => {
    return robots.find((r) => r.id === robotId)
  }

  return {
    robots,
    getRobotName,
    getRobot,
    isLoading,
    error,
  }
}
