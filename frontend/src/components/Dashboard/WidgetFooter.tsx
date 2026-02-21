import { HStack, Text, VStack } from "@chakra-ui/react"
import type { ReactNode } from "react"

interface WidgetFooterProps {
  footerInfo?: Array<{
    label: string
    value: string | ReactNode
  }>
  footerMessage?: string
}

export function WidgetFooter({ footerInfo, footerMessage }: WidgetFooterProps) {
  return (
    <>
      {/* Footer Info */}
      {footerInfo && footerInfo.length > 0 && (
        <VStack gap={2} align="stretch">
          {footerInfo.map((info, index) => (
            <HStack key={index} justify="space-between" fontSize="xs">
              <Text color="gray.600" fontWeight="medium">
                {info.label}
              </Text>
              {typeof info.value === "string" ? (
                <Text color="gray.800" fontFamily="mono">
                  {info.value}
                </Text>
              ) : (
                info.value
              )}
            </HStack>
          ))}
        </VStack>
      )}
      {footerMessage && (
        <Text fontSize="xs" color="gray.500" textAlign="center">
          {footerMessage}
        </Text>
      )}
    </>
  )
}
