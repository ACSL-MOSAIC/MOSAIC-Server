import { Container, Heading } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { DashboardGrid } from "@/components/Dashboard/DashboardGrid"
import { useState } from "react"
import { WidgetConfig } from "@/components/Dashboard/types"
import useAuth from "@/hooks/useAuth"
import { StoreManager } from "@/dashboard/store/store-manager"
import { cleanupAllDataChannels } from "@/rtc/webrtc-utils"

export const Route = createFileRoute("/_layout/connect/$robotId")({
  beforeLoad: async ({ params }) => {
    const robotIdList = params.robotId.split(',');
    console.log('대시보드 라우트 진입, 스토어 정리 시작');
    
    // 1. 기존 스토어 cleanup
    robotIdList.forEach(robotId => {
      console.log(`로봇 ${robotId} 스토어 cleanup`);
      cleanupAllDataChannels(robotId);
      StoreManager.getInstance().cleanupRobotStores(robotId);
    });

    // 2. 새로운 스토어 초기화
    robotIdList.forEach(robotId => {
      console.log(`로봇 ${robotId} 스토어 초기화`);
      StoreManager.getInstance().initializeRobotStores(robotId);
    });

    console.log('대시보드 라우트 진입, 스토어 정리 완료');
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { robotId } = Route.useParams()
  const { user } = useAuth()
  const robotIdList = robotId.split(',')

  return (
    <Container maxW="full">
      <DashboardGrid
        robotIdList={robotIdList}
        userId={user?.id || ""}
      />
    </Container>
  )
} 