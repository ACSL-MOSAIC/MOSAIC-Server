import { RobotsService } from "@/client"
import useAuth from "@/hooks/useAuth"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import React from "react"
import { RobotControl } from "../src/components/Robots/RobotControl"

function RobotControlPage() {
  const { user: currentUser } = useAuth()
  const { robotId } = Route.useSearch()

  const {
    data: robot,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["robot", robotId],
    queryFn: async () => {
      if (!robotId) return null
      const response = await RobotsService.readRobot({ id: robotId })
      return response
    },
    enabled: !!robotId,
  })

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  if (error) {
    return <div>에러 발생: {error.toString()}</div>
  }

  if (!currentUser) {
    return <div>로그인이 필요합니다.</div>
  }

  if (!robot) {
    return <div>로봇을 찾을 수 없습니다.</div>
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{robot.name} 제어</h1>
      </div>

      <div className="max-w-4xl mx-auto">
        <RobotControl userId={currentUser.id} robotId={robot.id} />
      </div>
    </div>
  )
}

export const Route = createFileRoute("/robot-control")({
  component: RobotControlPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      robotId: search.robotId as string,
    }
  },
})
