import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react"
import type React from "react"

export interface WidgetBodyProps {
  isConnected: boolean
  children: React.ReactNode
  footerInfo?: Array<{
    label: string
    value: string | React.ReactNode
  }>
  footerMessage?: string
  minHeight?: string
  padding?: string
}

function NoDataWidget() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      bg="gray.50"
      borderRadius="md"
      p={4}
    >
      <Badge colorScheme="gray" mb={2}>
        Not Connected
      </Badge>
      <Text fontSize="xs" color="gray.400" textAlign="center" mt={2}>
        Reconnect or connect to a robot is required.
      </Text>
    </Box>
  )
}

export function WidgetBody({
  isConnected,
  children,
  footerInfo = [],
  footerMessage,
  minHeight = "250px",
  padding = "3",
}: WidgetBodyProps) {
  // Show NO_DATA if not connected
  if (!isConnected) {
    return <NoDataWidget />
  }

  return (
    <>
      {/* Main Container */}
      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        p={padding}
        bg="white"
        boxShadow="sm"
        flex="1"
        minH={minHeight}
        position="relative"
        overflow="hidden"
      >
        {children}
      </Box>

      {/* Footer Info */}
      {footerInfo.length > 0 && (
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
