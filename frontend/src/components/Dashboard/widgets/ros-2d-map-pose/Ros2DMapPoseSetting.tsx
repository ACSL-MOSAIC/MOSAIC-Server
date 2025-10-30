import {
  Button,
  createListCollection,
  Field,
  Fieldset,
  Listbox,
} from "@chakra-ui/react"
import type React from "react"
import { useEffect, useState } from "react"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "../../../ui/dialog"
import { useWebSocket } from "@/contexts/WebSocketContext.tsx"
import { useRobotMapping } from "@/hooks/useRobotMapping.ts"
import { readOccupancyMapsApi } from "@/client/service/occupancy-map.api.ts"
import type { Ros2DMapPoseWidgetConfig } from "./Ros2DMapPoseWidget"

export const Ros2DMapPoseSetting: React.FC<{
  isOpen: boolean
  config: Ros2DMapPoseWidgetConfig
  onUpdateConfig?: (newConfig: Ros2DMapPoseWidgetConfig) => void
  onClose: () => void
}> = ({isOpen, config, onUpdateConfig, onClose}) => {
  const {robots} = useWebSocket()
  const {getRobotName} = useRobotMapping()

  const [selectedRobot, setSelectedRobot] = useState<string[]>(
    config?.robotIdList || [],
  )
  const [selectedOccupancyMap, setSelectedOccupancyMap] = useState<string[]>(
    config?.occupancyMapId ? [config.occupancyMapId] : [],
  )
  const [occupancyMaps, setOccupancyMaps] = useState<
    Array<{ label: string; value: string }>
  >([])

  useEffect(() => {
    const fetchOccupancyMaps = async () => {
      try {
        const response = await readOccupancyMapsApi(0, 100)
        const maps = response.data.map((map) => ({
          label: map.name,
          value: map.id,
        }))
        setOccupancyMaps(maps)
      } catch (error) {
        console.error("Failed to fetch occupancy maps:", error)
      }
    }

    if (isOpen) {
      fetchOccupancyMaps()
    }
  }, [isOpen])

  const robotList = createListCollection({
    items: robots.map((r) => {
      return {
        label: getRobotName(r.robot_id),
        value: r.robot_id,
      }
    }),
  })

  const occupancyMapList = createListCollection({
    items: occupancyMaps,
  })

  // Save configuration
  const handleSave = () => {
    const newConfig: Ros2DMapPoseWidgetConfig = {
      robotIdList: selectedRobot,
      occupancyMapId: selectedOccupancyMap[0] || undefined,
    }
    onUpdateConfig?.(newConfig)
    onClose()
  }

  // 설정 UI 구현 (예: 모달, 폼 등)
  return (
    <DialogRoot
      size={{base: "xs", md: "lg"}}
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
          <DialogTitle>Ros 2D Map Pose Widget Settings</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Fieldset.Root
            mb={4}
            style={{
              background: "#f8fafc",
              borderRadius: 8,
              padding: 16,
              border: "1px solid #e2e8f0",
            }}
          >
            <Field.Root mb={4}>
              <Field.Label>Target Robot ID</Field.Label>
              <Listbox.Root
                collection={robotList}
                value={selectedRobot}
                onValueChange={(robots) => setSelectedRobot(robots.value)}
                selectionMode="multiple"
                maxW="320px"
              >
                <Listbox.Content>
                  {robotList.items.map((robot) => (
                    <Listbox.Item item={robot} key={robot.value}>
                      <Listbox.ItemText>{robot.label}</Listbox.ItemText>
                      <Listbox.ItemIndicator/>
                    </Listbox.Item>
                  ))}
                </Listbox.Content>
              </Listbox.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Occupancy Map</Field.Label>
              <Listbox.Root
                collection={occupancyMapList}
                value={selectedOccupancyMap}
                onValueChange={(maps) => setSelectedOccupancyMap(maps.value)}
                selectionMode="single"
                maxW="320px"
              >
                <Listbox.Content>
                  {occupancyMapList.items.map((map) => (
                    <Listbox.Item item={map} key={map.value}>
                      <Listbox.ItemText>{map.label}</Listbox.ItemText>
                      <Listbox.ItemIndicator/>
                    </Listbox.Item>
                  ))}
                </Listbox.Content>
              </Listbox.Root>
            </Field.Root>
          </Fieldset.Root>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="subtle" colorPalette="gray" onClick={onClose}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button variant="solid" colorPalette="blue" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
