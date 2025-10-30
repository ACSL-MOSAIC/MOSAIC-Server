import {Button, Field, Fieldset, Input} from "@chakra-ui/react"
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
import type {VideoSegmentationWidgetConfig} from "./VideoSegmentationWidget"

export const VideoSegmentationSetting: React.FC<{
  isOpen: boolean
  config: VideoSegmentationWidgetConfig
  onUpdateConfig?: (newConfig: VideoSegmentationWidgetConfig) => void
  onClose: () => void
}> = ({isOpen, config, onUpdateConfig, onClose}) => {
  const [newConfig, setConfig] = useState<VideoSegmentationWidgetConfig>(
    config || {
      stream_id: "video_stream",
      tf_model: "deeplab",
    },
  )

  // Save configuration
  const handleSave = () => {
    if (newConfig.stream_id.trim() === "") {
      alert("Please enter a stream id.")
      return
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
          <DialogTitle>Video Segmentation Widget Settings</DialogTitle>
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
              <Field.Label>Target Stream ID</Field.Label>
              <Input
                value={newConfig.stream_id}
                onChange={(e) =>
                  setConfig((prev) => ({...prev, stream_id: e.target.value}))
                }
                placeholder="Enter Stream ID"
              />
            </Field.Root>

            <Field.Root mt={3}>
              <Field.Label>Segmentation Model</Field.Label>
              <select
                value={newConfig.tf_model}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    tf_model: e.target.value as any,
                  }))
                }
                style={{
                  padding: "8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                }}
              >
                <option value="deeplab">DeepLab</option>
              </select>
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
