import {
  getTabConfigApi,
  updateTabConfigApi,
} from "@/client/service/dashboard.api.ts"
import { WidgetFactory } from "@/components/Dashboard/WidgetFactory.tsx"
import useAuth from "@/hooks/useAuth.ts"
import { RobotConnector, type TabConfig, type WidgetConfig } from "@/mosaic"
import {
  Box,
  Container,
  HStack,
  Skeleton,
  SkeletonText,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Navigate } from "@tanstack/react-router"
import { type Layout, Responsive, WidthProvider } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import RobotConnectionPanel from "@/components/Dashboard/RobotConnectionPanel.tsx"
import { useMosaicWebRTCConnection } from "@/hooks/useMosaicWebRTCConnection.ts"
import { useRobotInfo } from "@/hooks/useRobotInfo.ts"
import { useEffect, useMemo, useRef, useState } from "react"

const ResponsiveGridLayout = WidthProvider(Responsive)

const extractRobotListFromTabConfig = (tabConfig: TabConfig): string[] => {
  const robotIds = tabConfig.widgets.flatMap((widgetConfig) =>
    widgetConfig.connectors.map((connector) => connector.robotId),
  )
  return [...new Set(robotIds)]
}

interface DashboardGridProps {
  tabId: string
}

export default function DashboardGrid({ tabId }: DashboardGridProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { robotInfos, subscribeRobots, unsubscribeRobots } = useRobotInfo()
  const { createConnection, disconnectConnection } = useMosaicWebRTCConnection()
  const [robotLoadError, setRobotLoadError] = useState<string | null>(null)
  const [editableWidgets, setEditableWidgets] = useState<WidgetConfig[]>([])
  const editableWidgetsRef = useRef<WidgetConfig[]>([])
  const isLayoutDirtyRef = useRef(false)

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
              return new RobotConnector(
                connector.robotId,
                connector.connectorId,
              )
            }),
          }
        }),
      } as TabConfig
    },
    enabled: !!user,
  })

  const saveLayoutMutation = useMutation({
    mutationFn: async ({
      targetTabId,
      widgets,
    }: {
      targetTabId: string
      widgets: WidgetConfig[]
    }) => {
      const tabConfigJson = JSON.stringify({
        widgets: widgets.map((widget) => ({
          ...widget,
          connectors: widget.connectors.map((connector) => ({
            robotId: connector.robotId,
            connectorId: connector.connectorId,
          })),
        })),
      })

      await updateTabConfigApi(targetTabId, {
        tabConfig: tabConfigJson,
      })
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["parsedDashboardTabConfig", variables.targetTabId],
      })
      await queryClient.invalidateQueries({
        queryKey: ["dashboardTabConfig", variables.targetTabId],
      })
    },
    onError: (error) => {
      console.error("Failed to save layout:", error)
      isLayoutDirtyRef.current = true
    },
  })

  useEffect(() => {
    if (!tabConfig) {
      setEditableWidgets([])
      editableWidgetsRef.current = []
      isLayoutDirtyRef.current = false
      return
    }

    setEditableWidgets(tabConfig.widgets)
    editableWidgetsRef.current = tabConfig.widgets
    isLayoutDirtyRef.current = false
  }, [tabConfig])

  const robotList = useMemo(
    () => (tabConfig ? extractRobotListFromTabConfig(tabConfig) : []),
    [tabConfig],
  )
  const hasAllRequiredRobots = useMemo(
    () =>
      robotList.every((robotId) => robotInfos.some((r) => r.id === robotId)),
    [robotList, robotInfos],
  )

  useEffect(() => {
    let isActive = true
    setRobotLoadError(null)

    if (robotList.length === 0) {
      return
    }

    const loadRobots = async () => {
      try {
        await subscribeRobots(robotList)
      } catch (error) {
        console.error("Failed to subscribe dashboard robots:", error)
        if (isActive) {
          setRobotLoadError("Failed to load robots for this dashboard.")
        }
      }
    }

    void loadRobots()

    return () => {
      isActive = false
      unsubscribeRobots()
    }
  }, [robotList, subscribeRobots, unsubscribeRobots])

  const mergeLayoutIntoWidgets = (
    widgets: WidgetConfig[],
    layout: Layout[],
  ): WidgetConfig[] => {
    const layoutById = new Map(layout.map((item) => [item.i, item]))
    let hasChanged = false

    const nextWidgets = widgets.map((widget) => {
      const nextLayout = layoutById.get(widget.id)
      if (!nextLayout) {
        return widget
      }

      if (
        widget.position.x === nextLayout.x &&
        widget.position.y === nextLayout.y &&
        widget.position.w === nextLayout.w &&
        widget.position.h === nextLayout.h
      ) {
        return widget
      }

      hasChanged = true
      return {
        ...widget,
        position: {
          x: nextLayout.x,
          y: nextLayout.y,
          w: nextLayout.w,
          h: nextLayout.h,
        },
      }
    })

    return hasChanged ? nextWidgets : widgets
  }

  const handleLayoutChange = (layout: Layout[]) => {
    const nextWidgets = mergeLayoutIntoWidgets(
      editableWidgetsRef.current,
      layout,
    )
    if (nextWidgets === editableWidgetsRef.current) {
      return
    }

    editableWidgetsRef.current = nextWidgets
    setEditableWidgets(nextWidgets)
    isLayoutDirtyRef.current = true
  }

  const handleLayoutCommit = (layout: Layout[]) => {
    if (!tabConfig) {
      return
    }

    const nextWidgets = mergeLayoutIntoWidgets(
      editableWidgetsRef.current,
      layout,
    )
    if (nextWidgets !== editableWidgetsRef.current) {
      editableWidgetsRef.current = nextWidgets
      setEditableWidgets(nextWidgets)
      isLayoutDirtyRef.current = true
    }

    if (!isLayoutDirtyRef.current) {
      return
    }
    isLayoutDirtyRef.current = false

    saveLayoutMutation.mutate({
      targetTabId: tabConfig.id,
      widgets: nextWidgets,
    })
  }

  if (isConfigLoading) {
    return (
      <Container maxW="full" py={8}>
        <HStack gap={3}>
          <Spinner size="sm" />
          <Text>Loading dashboard tabs...</Text>
        </HStack>
      </Container>
    )
  }

  if (!tabConfig) {
    return <Navigate to="/dashboard" />
  }

  if (robotLoadError) {
    return (
      <Container maxW="full" py={8}>
        <Box
          borderWidth="1px"
          borderColor="red.200"
          borderRadius="md"
          bg="red.50"
          px={4}
          py={3}
        >
          <Text color="red.700">{robotLoadError}</Text>
        </Box>
      </Container>
    )
  }

  if (robotList.length > 0 && !hasAllRequiredRobots) {
    return (
      <Container maxW="full" py={8}>
        <VStack align="stretch" gap={4}>
          <HStack gap={3}>
            <Spinner size="sm" />
            <Text>Loading robots for this dashboard...</Text>
          </HStack>
          <Box borderWidth="1px" borderRadius="md" p={4} bg="white">
            <Skeleton height="26px" width="280px" mb={3} />
            <SkeletonText noOfLines={1} width="220px" mb={4} />
            <HStack gap={4}>
              <Skeleton height="150px" flex={1} />
              <Skeleton height="150px" flex={1} />
            </HStack>
          </Box>
          <HStack gap={4}>
            <Skeleton height="280px" flex={1} />
            <Skeleton height="280px" flex={1} />
          </HStack>
        </VStack>
      </Container>
    )
  }

  const connectToRobot = async (robotId: string) => {
    console.log(`connectToRobot: ${robotId}`)
    await createConnection([robotId])
  }

  const disconnectFromRobot = (robotId: string) => {
    console.log(`disconnectFromRobot: ${robotId}`)
    disconnectConnection(robotId)
  }

  const connectAllRobots = async () => {
    console.log("connectAllRobots")
    await createConnection(robotList)
  }

  const disconnectAllRobots = () => {
    console.log("disconnectAllRobots")
    for (const robotId of robotList) {
      disconnectConnection(robotId)
    }
  }

  return (
    <Box p={4}>
      <RobotConnectionPanel
        onConnect={connectToRobot}
        onDisconnect={disconnectFromRobot}
        onConnectAll={connectAllRobots}
        onDisconnectAll={disconnectAllRobots}
      />

      <ResponsiveGridLayout
        className="layout"
        layouts={{
          lg: editableWidgets.map((w) => ({
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
        onDragStop={(layout) => handleLayoutCommit(layout)}
        onResizeStop={(layout) => handleLayoutCommit(layout)}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
        draggableHandle=".draggable-header"
      >
        {editableWidgets.map((widgetConfig) => (
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
