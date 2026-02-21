import type { WidgetConfig } from "@/mosaic"
import { Flex, HStack, Text, VStack } from "@chakra-ui/react"

export interface WidgetHeaderProps {
  widgetConfig: WidgetConfig
}

export function WidgetHeader({
  widgetConfig: { type, connectors },
}: WidgetHeaderProps) {
  return (
    <HStack cursor="move">
      <Flex
        justify="space-between"
        align="center"
        className="draggable-header"
        width="100%"
      >
        <VStack gap={0} align="start">
          <Text fontSize="sm" fontWeight="bold" color="green.500">
            {type}
          </Text>
          <Text fontSize="xs" color="gray.600">
            Robot: {connectors.map((c) => c.robotId).join(", ")}
          </Text>
        </VStack>
      </Flex>

      {/*{onRemove && (*/}
      {/*  <Button*/}
      {/*    size="xs"*/}
      {/*    variant="solid"*/}
      {/*    colorScheme="teal"*/}
      {/*    onClick={(e) => {*/}
      {/*      e.stopPropagation()*/}
      {/*      onRemove()*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    Remove*/}
      {/*  </Button>*/}
      {/*)}*/}
      {/*{onSettingClick && (*/}
      {/*  <IconButton*/}
      {/*    size="xs"*/}
      {/*    variant="outline"*/}
      {/*    colorScheme="teal"*/}
      {/*    onClick={(e) => {*/}
      {/*      e.stopPropagation()*/}
      {/*      onSettingClick()*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    <IoSettings />*/}
      {/*  </IconButton>*/}
      {/*)}*/}
    </HStack>
  )
}
