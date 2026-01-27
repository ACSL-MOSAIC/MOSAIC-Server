import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import type {RobotInfo} from "@/contexts/WebSocketContext.tsx"
import {useRobotMapping} from "@/hooks/useRobotMapping"
import {
  Button,
  Portal,
  Select,
  Stack,
  createListCollection,
} from "@chakra-ui/react"
import {useState} from "react"
import type {WidgetType} from "./types"
import {UniversalWidgetConfigurator} from "./widgets/dynamic/UniversalWidgetConfigurator"

interface AddWidgetModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (type: WidgetType, robotId?: string, config?: any) => void
  robots: RobotInfo[]
}

export function AddWidgetModal({
                                 isOpen,
                                 onClose,
                                 onAdd,
                                 robots,
                               }: AddWidgetModalProps) {
  const [selectedRobotId, setSelectedRobotId] = useState<string>("")
  const [selectedType, setSelectedType] = useState<WidgetType>("universal")
  const [showUniversalConfig, setShowUniversalConfig] = useState(false)
  const {getRobotName} = useRobotMapping()

  const robotCollection = createListCollection({
    items: robots.map((robotInfo) => ({
      label: getRobotName(robotInfo.robot_id),
      value: robotInfo.robot_id,
    })),
  })

  const widgetTypeCollection = createListCollection<{
    label: string
    value: WidgetType
  }>({
    items: [
      {label: "Universal Widget", value: "universal"},
      {label: "Video Stream", value: "video_stream"},
      {label: "Video Stream (Additional)", value: "video_stream_v2"},
      {label: "Video Object Detection", value: "video_object_detection"},
      {label: "Video Segmentation", value: "video_segmentation"},
      {label: "Video Recorder", value: "video_recorder"},
      {label: "LiDAR PointCloud", value: "lidar_pointcloud"},
      {label: "Remote Control Pad", value: "remote_control_pad"},
      {label: "Turtlesim Position", value: "turtlesim_position"},
      {label: "Go2 Low State", value: "go2_low_state"},
      {label: "Gps Map", value: "osm_gps_map"},
      {label: "ROS 2D Map Pose", value: "ros_2d_map_pose"},
    ],
  })

  const defaultWidgetConfig = createListCollection({
    items: [
      {
        label: "video_object_detection",
        value: {
          stream_id: "video_stream",
          tf_model: "coco-ssd",
        },
      },
      {
        label: "video_segmentation",
        value: {
          stream_id: "video_stream",
          tf_model: "deeplab",
        },
      },
      {
        label: "osm_gps_map",
        value: {
          robotIdList: [],
        },
      },
      {
        label: "ros_2d_map_pose",
        value: {
          robotIdList: [],
        },
      },
    ],
  })

  const addWidget = (widgetType: WidgetType, robotId: string, config?: any) => {
    const defaultConfig = defaultWidgetConfig.items.find(
      (item) => item.label === widgetType,
    )?.value
    onAdd(widgetType, robotId, config || defaultConfig)
    onClose()
  }

  const handleAdd = () => {
    if (selectedType === "osm_gps_map" || selectedType === "ros_2d_map_pose") {
      // osm gps map 과 ros 2d map pose widget 은 robot id 가 필요하지 않음
      addWidget(selectedType, selectedRobotId)
    }

    if (selectedRobotId) {
      if (selectedType === "universal") {
        setShowUniversalConfig(true)
      } else {
        addWidget(selectedType, selectedRobotId)
      }
    }
  }

  const handleUniversalConfigComplete = (config: any) => {
    addWidget("universal", selectedRobotId, config)
    setShowUniversalConfig(false)
  }

  // Universal Widget 설정 모달이 열려있으면 해당 모달을 렌더링
  if (showUniversalConfig) {
    return (
      <UniversalWidgetConfigurator
        isOpen={showUniversalConfig}
        onClose={() => setShowUniversalConfig(false)}
        onComplete={handleUniversalConfigComplete}
        robotId={selectedRobotId}
      />
    )
  }

  return (
    <DialogRoot
      size={{base: "xs", md: "md"}}
      placement="center"
      open={isOpen}
      onOpenChange={({open}) => !open && onClose()}
    >
      <DialogContent
        style={{
          overflow: "visible",
          position: "relative",
          zIndex: 1000,
        }}
      >
        <DialogCloseTrigger/>
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Stack gap={4}>
            <Select.Root
              collection={robotCollection}
              value={[selectedRobotId]}
              onValueChange={(details) => setSelectedRobotId(details.value[0])}
              size="md"
            >
              <Select.HiddenSelect/>
              <Select.Label>Select Robot</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select a robot"/>
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator/>
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner style={{zIndex: 9999}}>
                  <Select.Content
                    style={{
                      position: "relative",
                      zIndex: 9999,
                      backgroundColor: "white",
                    }}
                  >
                    {robotCollection.items.map((robot) => (
                      <Select.Item item={robot} key={robot.value}>
                        {robot.label}
                        <Select.ItemIndicator/>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>

            <Select.Root
              collection={widgetTypeCollection}
              value={[selectedType]}
              onValueChange={(details) =>
                setSelectedType(details.value[0] as WidgetType)
              }
              size="md"
            >
              <Select.HiddenSelect/>
              <Select.Label>Widget Type</Select.Label>
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Select widget type"/>
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator/>
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner style={{zIndex: 9999}}>
                  <Select.Content
                    style={{
                      position: "relative",
                      zIndex: 9999,
                      backgroundColor: "white",
                    }}
                  >
                    {widgetTypeCollection.items.map((type) => (
                      <Select.Item item={type} key={type.value}>
                        {type.label}
                        <Select.ItemIndicator/>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Stack>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="subtle" colorPalette="gray">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            variant="solid"
            colorPalette="blue"
            onClick={handleAdd}
            disabled={!selectedType}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
