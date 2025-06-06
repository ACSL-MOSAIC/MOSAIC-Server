import { Container, Heading } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { DashboardGrid } from "@/components/Dashboard/DashboardGrid"
import { useState } from "react"
import { WidgetConfig } from "@/components/Dashboard/types"
import { useWebSocket } from "@/contexts/WebSocketContext"

export const Route = createFileRoute("/_layout/connect/$robotId")({
  component: DashboardPage,
})

function DashboardPage() {
  const { robotId } = Route.useParams()
  const { robots } = useWebSocket()
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])

  const handleWidgetAdd = (widget: WidgetConfig) => {
    setWidgets(prev => [...prev, widget])
  }

  const handleWidgetRemove = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
  }

  const handleWidgetMove = (widgetId: string, position: { x: number; y: number }) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId 
        ? { ...w, position: { ...w.position, ...position } }
        : w
    ))
  }

  const connectedRobots = robots.map(robot => robot.robot_id)

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} py={12}>
        로봇 대시보드
      </Heading>
      <DashboardGrid
        robotId={robotId}
        widgets={widgets}
        onWidgetAdd={handleWidgetAdd}
        onWidgetRemove={handleWidgetRemove}
        onWidgetMove={handleWidgetMove}
        connectedRobots={connectedRobots}
      />
    </Container>
  )
} 