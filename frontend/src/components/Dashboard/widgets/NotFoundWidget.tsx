import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import type { WidgetProps } from "@/components/Dashboard/widgets/index.ts"
import { Text, VStack } from "@chakra-ui/react"

export default function NotFoundWidget({ widgetConfig }: WidgetProps) {
  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <VStack align="start" gap={2}>
        <Text fontSize="sm" fontWeight="semibold" color="orange.600">
          Unsupported Widget
        </Text>
        <Text fontSize="sm" color="gray.700">
          Unknown widget type: {widgetConfig.type}
        </Text>
      </VStack>
    </WidgetFrame>
  )
}
