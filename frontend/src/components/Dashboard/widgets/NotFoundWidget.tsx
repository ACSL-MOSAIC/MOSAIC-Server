import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import type { WidgetProps } from "@/components/Dashboard/widgets/index.ts"
import { Box, Code, Flex, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { LuPuzzle, LuWrench } from "react-icons/lu"

export default function NotFoundWidget({ widgetConfig }: WidgetProps) {
  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <Flex h="100%" align="center" justify="center">
        <Box
          w="100%"
          h="100%"
          bgGradient="linear(to-b, orange.50, white)"
          p={4}
        >
          <VStack align="start" gap={4} h="100%">
            <HStack gap={2}>
              <Flex
                w="7"
                h="7"
                align="center"
                justify="center"
                borderRadius="full"
                bg="orange.100"
                color="orange.700"
              >
                <Icon as={LuPuzzle} boxSize={4} />
              </Flex>
              <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="semibold" color="orange.800">
                  Unsupported Widget
                </Text>
                <Text fontSize="xs" color="gray.600">
                  This widget type is not available in this build.
                </Text>
              </VStack>
            </HStack>

            <Box
              w="100%"
              p={3}
              border="1px solid"
              borderColor="orange.200"
              borderRadius="md"
              bg="white"
            >
              <Text fontSize="xs" color="gray.500" mb={1}>
                Requested type
              </Text>
              <Code fontSize="xs">{widgetConfig.type}</Code>
            </Box>

            <HStack gap={2} color="gray.600">
              <Icon as={LuWrench} boxSize={3.5} />
              <Text fontSize="xs">
                Add the matching widget component in
                <Code mx={1} fontSize="xs">
                  /Dashboard/widgets
                </Code>
                and register by filename.
              </Text>
            </HStack>
          </VStack>
        </Box>
      </Flex>
    </WidgetFrame>
  )
}
