import {
  Button,
  createListCollection,
  Field,
  Fieldset,
  Listbox,
} from "@chakra-ui/react"
import type React from "react"
import {useState} from "react"
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
import type {OsmGpsMapWidgetConfig} from "./OsmGpsMapWidget"
import {useWebSocket} from "@/contexts/WebSocketContext.tsx"
import {useRobotMapping} from "@/hooks/useRobotMapping.ts"

export const OsmGpsMapSetting: React.FC<{
  isOpen: boolean
  config: OsmGpsMapWidgetConfig
  onUpdateConfig?: (newConfig: OsmGpsMapWidgetConfig) => void
  onClose: () => void
}> = ({isOpen, config, onUpdateConfig, onClose}) => {
  const {robots} = useWebSocket()
  const {getRobotName} = useRobotMapping()

  const [selectedRobot, setSelectedRobot] = useState<string[]>(
    config?.robotIdList || [],
  )

  const robotList = createListCollection({
    items: robots.map((r) => {
      return {
        label: getRobotName(r.robot_id),
        value: r.robot_id,
      }
    }),
  })

  // Save configuration
  const handleSave = () => {
    config.robotIdList = selectedRobot
    onUpdateConfig?.({
      robotIdList: selectedRobot,
    })
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
          <DialogTitle>GPS Map Widget Settings</DialogTitle>
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
            <Field.Root>
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
