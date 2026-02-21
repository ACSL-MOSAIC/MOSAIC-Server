import { getTabConfigApi } from "@/client/service/dashboard.api.ts"
// import RobotConnectionPanel from "@/components/Dashboard/RobotConnectionPanel.tsx"
import { WidgetFactory } from "@/components/Dashboard/WidgetFactory.tsx"
import useAuth from "@/hooks/useAuth.ts"
import { RobotConnector, type TabConfig, type WidgetConfig } from "@/mosaic"
import { Box, Container, HStack, Spinner, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Navigate } from "@tanstack/react-router"
import { Responsive, WidthProvider } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardGridProps {
  tabId: string
}

export default function DashboardGrid({ tabId }: DashboardGridProps) {
  const { user } = useAuth()

  const { data: tabConfig, isPending: isConfigLoading } = useQuery({
    queryKey: ["parsedDashboardTabConfig", tabId],
    queryFn: async () => {
      const tabConfigDto = await getTabConfigApi(tabId)
      const widgets = JSON.parse(tabConfigDto.widgets).widgets as WidgetConfig[]
      return {
        id: tabConfigDto.id,
        name: tabConfigDto.name,
        widgets: widgets.map((widget) => {
          return {
            id: widget.id,
            type: widget.type,
            position: widget.position,
            connectors: widget.connectors.map((connector) => {
              // TODO: Need to be resolved by RobotConfig
              return new RobotConnector(
                connector.robotId,
                connector.connectorId,
                "byte-bi",
              )
            }),
          }
        }),
      } as TabConfig
    },
    enabled: !!user,
  })

  const handleLayoutChange = (layout: any) => {
    // TODO: save layout to db
    console.log(layout)
  }

  if (isConfigLoading) {
    return (
      <Container maxW="full" py={8}>
        <HStack gap={3}>
          <Spinner size="sm" />
          <Text>대시보드 탭을 불러오는 중입니다.</Text>
        </HStack>
      </Container>
    )
  }

  if (!isConfigLoading && !tabConfig) {
    return <Navigate to="/dashboard" />
  }

  return (
    <Box p={4}>
      {/* Robot connection management panel */}
      {/*<RobotConnectionPanel*/}
      {/*  connections={connections}*/}
      {/*  onConnect={connectToRobot}*/}
      {/*  onDisconnect={disconnectFromRobot}*/}
      {/*  onConnectAll={handleConnectAllRobots}*/}
      {/*  onDisconnectAll={handleDisconnectAllRobots}*/}
      {/*/>*/}

      <ResponsiveGridLayout
        className="layout"
        layouts={{
          lg: tabConfig.widgets.map((w) => ({
            i: w.id,
            x: w.position.x,
            y: w.position.y,
            w: w.position.w,
            h: w.position.h,
            minW: 2,
            minH: 2,
            maxW: 15,
            maxH: 15,
          })),
        }}
        breakpoints={{ lg: 1500, md: 1245, sm: 960, xs: 600, xxs: 0 }}
        cols={{ lg: 15, md: 12, sm: 8, xs: 6, xxs: 3 }}
        rowHeight={100}
        width={1500}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
        draggableHandle=".draggable-header"
      >
        {tabConfig.widgets.map((widgetConfig) => (
          <Box
            key={widgetConfig.id}
            bg="white"
            p={4}
            borderRadius="md"
            boxShadow="sm"
            height="100%"
            display="flex"
            flexDirection="column"
            mb={4}
          >
            <WidgetFactory widgetConfig={widgetConfig} />
          </Box>
        ))}
      </ResponsiveGridLayout>
    </Box>
  )
}
