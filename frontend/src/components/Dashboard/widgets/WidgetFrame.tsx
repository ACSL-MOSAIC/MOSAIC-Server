import { WidgetBody } from "@/components/Dashboard/widgets/WidgetBody.tsx"
import { WidgetHeader } from "@/components/Dashboard/widgets/WidgetHeader.tsx"
import { VStack } from "@chakra-ui/react"
import type React from "react"

export interface WidgetFrameProps {
  title: string
  robot_id?: string
  isConnected: boolean
  onSettingClick?: () => void
  children?: React.ReactNode
  footerInfo?: Array<{
    label: string
    value: string | React.ReactNode
  }>
  footerMessage?: string
  minHeight?: string
  padding?: string
  onRemove?: () => void
}

export function WidgetFrame({
  title,
  robot_id,
  isConnected,
  onSettingClick,
  children,
  footerInfo = [],
  footerMessage,
  minHeight = "250px",
  padding = "3",
  onRemove,
}: WidgetFrameProps) {
  return (
    <VStack gap={3} align="stretch" h="100%">
      {/* Header - 드래그 가능한 영역 */}
      <WidgetHeader
        title={title}
        robot_id={robot_id}
        isConnected={isConnected}
        onSettingClick={onSettingClick}
        onRemove={onRemove}
      />

      <WidgetBody
        isConnected={isConnected}
        minHeight={minHeight}
        padding={padding}
        footerInfo={footerInfo}
        footerMessage={footerMessage}
      >
        {children}
      </WidgetBody>
    </VStack>
  )
}
