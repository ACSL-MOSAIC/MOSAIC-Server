import {useWebSocket} from "@/contexts/WebSocketContext"
import {
  type DataChannelConfig,
  type VideoChannelConfig,
  WebRTCConnection,
} from "@/rtc/webrtc-connection"
import {Box} from "@chakra-ui/react"
import React, {useState, useEffect, useRef} from "react"
import {Responsive, WidthProvider} from "react-grid-layout"
import {v4 as uuidv4} from "uuid"
import {TabManager} from "./TabManager"
import type {DashboardConfig, WidgetConfig, WidgetType} from "./types"
import {WidgetFactory} from "./widgets/WidgetFactory"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import {toaster} from "@/components/ui/toaster"
import {
  useDashboardConfigMutation,
  useDashboardConfigQuery,
} from "@/hooks/useDashboardConfig"
import {DEFAULT_DATA_CHANNELS} from "@/rtc/config/webrtc-datachannel-config.ts"
import {useQueryClient} from "@tanstack/react-query"
import RobotConnectionPanel from "./RobotConnectionPanel"
import {
  addTab,
  addWidget,
  removeTab,
  removeWidget,
  renameTab,
} from "./dashboardUtils"

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardGridProps {
  onOpenDynamicTypeModal: (robotId: string) => void
}

export function DashboardGrid({onOpenDynamicTypeModal}: DashboardGridProps) {
  const {data: dashboardConfig} = useDashboardConfigQuery()
  const {mutate: saveDashboardConfig} = useDashboardConfigMutation()
  const queryClient = useQueryClient()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [connections, setConnections] = useState<{ [key: string]: boolean }>({})
  const ws = useWebSocket()

  // Ref to manage WebRTC connection objects
  const rtcConnections = useRef<{ [key: string]: WebRTCConnection }>({})

  // Create refs for each robot (dynamically managed)
  const videoRefs = useRef<{
    [key: string]: React.RefObject<HTMLVideoElement>
  }>({})
  const canvasRefs = useRef<{
    [key: string]: React.RefObject<HTMLCanvasElement>
  }>({})
  const positionElementRefs = useRef<{
    [key: string]: React.RefObject<HTMLDivElement>
  }>({})

  // Initialize refs function
  const initializeRefs = (robotId: string) => {
    if (!videoRefs.current[robotId]) {
      videoRefs.current[robotId] = React.createRef<HTMLVideoElement>()
    }
    if (!canvasRefs.current[robotId]) {
      canvasRefs.current[robotId] = React.createRef<HTMLCanvasElement>()
    }
    if (!positionElementRefs.current[robotId]) {
      positionElementRefs.current[robotId] = React.createRef<HTMLDivElement>()
    }
  }

  // Mark as unsaved when config changes
  const updateConfig = (newConfig: DashboardConfig) => {
    queryClient.setQueryData(["dashboardConfig"], newConfig)
    setHasUnsavedChanges(true)
  }

  // Save function
  const handleSave = () => {
    if (dashboardConfig) {
      saveDashboardConfig(dashboardConfig)
      setHasUnsavedChanges(false)
      toaster.create({
        title: "Settings Saved",
        description: "Dashboard settings have been saved successfully.",
      })
    }
  }

  // Connection state change handler
  const handleConnectionStateChange = (
    robotId: string,
    isConnected: boolean,
  ) => {
    setConnections((prev) => ({
      ...prev,
      [robotId]: isConnected,
    }))
  }

  const widgetConfigToChannelConfig = (widgetConfig: WidgetConfig) => {
    const dataChannelConfigs: DataChannelConfig[] = []
    const videoChannelConfigs: VideoChannelConfig[] = []

    if (widgetConfig.type === "video_stream") {
      // turtlesim video is the only video type
      const videoChannelConfig: VideoChannelConfig = {
        label: widgetConfig.id,
        dataType: widgetConfig.dataType,
      }
      videoChannelConfigs.push(videoChannelConfig)
    } else {
      // For other widget types, create data channel configs
      const dcConfigs = DEFAULT_DATA_CHANNELS.filter(
        (dc) => dc.dataType === widgetConfig.dataType,
      ).map((dc) => {
        const dataChannelConfig: DataChannelConfig = {
          label: dc.label,
          dataType: dc.dataType,
          channelType: dc.channelType,
        }
        return dataChannelConfig
      })
      dataChannelConfigs.push(...dcConfigs)
    }

    return {
      dataChannelConfigs,
      videoChannelConfigs,
    }
  }

  // Connect to robot function
  const connectToRobot = async (robotId: string) => {
    try {
      if (rtcConnections.current[robotId]) {
        const connection = rtcConnections.current[robotId]
        connection.disconnect()
        delete rtcConnections.current[robotId]
      }

      // Initialize refs
      initializeRefs(robotId)

      const dataChannelConfigs: DataChannelConfig[] = []
      const videoChannelConfigs: VideoChannelConfig[] = []

      activeTab?.widgets
        .filter(
          (wc) =>
            wc.robotId === robotId || wc.config?.robotIdList?.includes(robotId),
        )
        .forEach((widgetConfig) => {
          const {
            dataChannelConfigs: dcConfigs,
            videoChannelConfigs: vcConfigs,
          } = widgetConfigToChannelConfig(widgetConfig)
          dataChannelConfigs.push(...dcConfigs)
          videoChannelConfigs.push(...vcConfigs)
        })

      const connection = new WebRTCConnection({
        robotId,
        ws,
        onConnectionStateChange: (isConnected) =>
          handleConnectionStateChange(robotId, isConnected),
        dataChannels: dataChannelConfigs,
        videoChannels: videoChannelConfigs,
      })

      await connection.startConnection()
      rtcConnections.current[robotId] = connection
    } catch (error) {
      console.error(`Robot ${robotId} connection failed:`, error)
      throw error
    }
  }

  // Disconnect from robot function
  const disconnectFromRobot = (robotId: string) => {
    const connection = rtcConnections.current[robotId]
    if (connection) {
      connection.disconnect()
      delete rtcConnections.current[robotId]
      handleConnectionStateChange(robotId, false)

      // Auto-remove widget feature removed - changed to show NO_DATA
    }
  }

  // Connect all robots function
  const handleConnectAllRobots = async () => {
    console.log("Attempting to connect all robots")
    const readyRobots = ws.robots.filter(
      (robot) => robot.state === "READY_TO_CONNECT",
    )

    for (const robot of readyRobots) {
      try {
        await connectToRobot(robot.robot_id)
      } catch (error) {
        console.error(`Robot ${robot.robot_id} connection failed:`, error)
      }
    }
  }

  // Disconnect all robots function
  const handleDisconnectAllRobots = () => {
    Object.keys(rtcConnections.current).forEach((robotId) => {
      disconnectFromRobot(robotId)
    })
  }

  // Tab management functions
  const handleAddTab = (tabName: string) => {
    if (dashboardConfig) {
      const newConfig = addTab(dashboardConfig, tabName)
      updateConfig(newConfig)
    }
  }

  const handleRemoveTab = (tabId: string) => {
    if (dashboardConfig) {
      const newConfig = removeTab(dashboardConfig, tabId)
      updateConfig(newConfig)
    }
  }

  const handleRenameTab = (tabId: string, newName: string) => {
    if (dashboardConfig) {
      const newConfig = renameTab(dashboardConfig, tabId, newName)
      updateConfig(newConfig)
    }
  }

  const handleTabChange = (tabId: string) => {
    if (dashboardConfig) {
      updateConfig({
        ...dashboardConfig,
        activeTabId: tabId,
      })
    }
  }

  const handleAddWidget = (
    type: WidgetType,
    selectedRobotId?: string,
    config?: any,
  ) => {
    if (!dashboardConfig) return

    // Set appropriate data type based on widget type
    const dataType = type

    const newWidget: WidgetConfig = {
      id: uuidv4(),
      type,
      position: {x: 0, y: 0, w: 4, h: 4},
      robotId: selectedRobotId,
      dataType,
      config,
    }

    const newConfig = addWidget(
      dashboardConfig,
      dashboardConfig.activeTabId,
      newWidget,
    )
    updateConfig(newConfig)
  }

  const handleRemoveWidget = (widgetId: string) => {
    if (dashboardConfig) {
      const newConfig = removeWidget(
        dashboardConfig,
        dashboardConfig.activeTabId,
        widgetId,
      )
      updateConfig(newConfig)
    }
  }

  // Layout change handler
  const handleLayoutChange = (layout: any) => {
    if (!dashboardConfig) return

    const newConfig = {
      ...dashboardConfig,
      tabs: dashboardConfig.tabs.map((tab) => {
        if (tab.id === dashboardConfig.activeTabId) {
          return {
            ...tab,
            widgets: tab.widgets.map((widget) => {
              const newLayout = layout.find((l: any) => l.i === widget.id)
              if (newLayout) {
                return {
                  ...widget,
                  position: {
                    x: newLayout.x,
                    y: newLayout.y,
                    w: newLayout.w,
                    h: newLayout.h,
                  },
                }
              }
              return widget
            }),
          }
        }
        return tab
      }),
    }
    updateConfig(newConfig)
  }

  // UniversalWidget에서 config 수정 시 위젯만 교체
  const handleUpdateWidgetConfig = (widgetId: string, newConfig: any) => {
    if (!dashboardConfig) return
    const newTabs = dashboardConfig.tabs.map((tab) => {
      if (tab.id !== dashboardConfig.activeTabId) return tab
      return {
        ...tab,
        widgets: tab.widgets.map((w) =>
          w.id === widgetId ? {...w, config: newConfig} : w,
        ),
      }
    })
    updateConfig({...dashboardConfig, tabs: newTabs})
  }

  // Disconnect all connections on component unmount
  useEffect(() => {
    return () => {
      Object.keys(rtcConnections.current).forEach((robotId) => {
        disconnectFromRobot(robotId)
      })
    }
  }, [])

  if (!dashboardConfig) {
    return <Box p={4}>Loading...</Box>
  }

  const activeTab = dashboardConfig.tabs.find(
    (tab) => tab.id === dashboardConfig.activeTabId,
  )
  if (!activeTab) {
    return <Box p={4}>Tab not found.</Box>
  }

  return (
    <Box p={4}>
      {/* Robot connection management panel */}
      <RobotConnectionPanel
        connections={connections}
        onConnect={connectToRobot}
        onDisconnect={disconnectFromRobot}
        onConnectAll={handleConnectAllRobots}
        onDisconnectAll={handleDisconnectAllRobots}
        onOpenDynamicTypeModal={onOpenDynamicTypeModal}
      />

      {/* Tab manager */}
      <TabManager
        tabs={dashboardConfig.tabs.map((tab) => ({
          id: tab.id,
          name: tab.name,
        }))}
        activeTabId={dashboardConfig.activeTabId}
        onTabChange={handleTabChange}
        onAddTab={handleAddTab}
        onRemoveTab={handleRemoveTab}
        onRenameTab={handleRenameTab}
        onAddWidget={handleAddWidget}
        onSaveChanges={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        robots={ws.robots}
      />

      <ResponsiveGridLayout
        className="layout"
        layouts={{
          lg: activeTab.widgets.map((w) => ({
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
        breakpoints={{lg: 1500, md: 1245, sm: 960, xs: 600, xxs: 0}}
        cols={{lg: 15, md: 12, sm: 8, xs: 6, xxs: 3}}
        rowHeight={100}
        width={1500}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        margin={[16, 16]}
        draggableHandle=".draggable-header"
      >
        {activeTab.widgets.map((widget) => (
          <Box
            key={widget.id}
            bg="white"
            p={4}
            borderRadius="md"
            boxShadow="sm"
            height="100%"
            display="flex"
            flexDirection="column"
            mb={4}
          >
            <WidgetFactory
              type={widget.type}
              robotId={widget.robotId}
              dataType={widget.dataType}
              connections={connections}
              config={widget.config}
              widgetId={widget.id}
              onRemove={() => handleRemoveWidget(widget.id)}
              onUpdateConfig={(newConfig) =>
                handleUpdateWidgetConfig(widget.id, newConfig)
              }
            />
          </Box>
        ))}
      </ResponsiveGridLayout>
    </Box>
  )
}
