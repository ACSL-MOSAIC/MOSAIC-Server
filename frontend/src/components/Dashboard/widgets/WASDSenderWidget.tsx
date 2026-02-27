import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import type { WidgetProps } from "@/components/Dashboard/widgets/index.ts"
import { useMosaicStore } from "@/hooks/useMosaicStore.ts"
import type { SendableStore } from "@/mosaic/store/interface/sendable-store.ts"
import type { SimpleDirection } from "@/mosaic/store/type/simple-direction.ts"
import { Box, Button, Grid, Text } from "@chakra-ui/react"
import { useEffect, useRef } from "react"

type Direction = "up" | "down" | "left" | "right" | "stop"

const DirectionIcon = ({ direction }: { direction: Direction }) => {
  const getIcon = () => {
    switch (direction) {
      case "up":
        return "↑"
      case "down":
        return "↓"
      case "left":
        return "←"
      case "right":
        return "→"
      default:
        return "•"
    }
  }

  return (
    <Text fontSize="lg" fontWeight="bold">
      {getIcon()}
    </Text>
  )
}

export default function WASDSenderWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore()
  const storeRef = useRef<SendableStore<SimpleDirection> | null>(null)

  useEffect(() => {
    const connector = widgetConfig.connectors[0]
    if (!connector) {
      return
    }

    storeRef.current = getOrCreateStore(
      connector,
    ) as SendableStore<SimpleDirection>
    if (storeRef.current === null) {
      return
    }

    return () => {
      releaseStore(connector)
      storeRef.current = null
    }
  }, [widgetConfig])

  const handleClick = (direction: Direction) => {
    console.log("direction", direction)
    storeRef.current?.send(direction)
  }

  const DirectionButton = ({ direction }: { direction: Direction }) => {
    return (
      <Button
        size="lg"
        colorScheme="teal"
        onClick={() => handleClick(direction)}
        borderRadius="md"
        boxShadow="md"
        _hover={{
          transform: "translateY(2px)",
          boxShadow: "lg",
        }}
        _active={{
          transform: "translateY(0px)",
          boxShadow: "sm",
        }}
        transition="all 0.2s"
        minH="50px"
      >
        <DirectionIcon direction={direction} />
      </Button>
    )
  }

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <Box
        bg="gray.50"
        borderRadius="xl"
        p={4}
        boxShadow="inset 0 2px 4px rgba(0,0,0,0.1)"
        position="relative"
      >
        <Grid templateColumns="repeat(3, 1fr)" gap={2} maxW="180px" mx="auto">
          {/* empty */}
          <Box />

          {/* up */}
          <DirectionButton direction="up" />

          {/* empty */}
          <Box />

          {/* left */}
          <DirectionButton direction="left" />

          {/* center */}
          <DirectionButton direction="stop" />

          {/* right */}
          <DirectionButton direction="right" />

          {/* empty */}
          <Box />

          {/* down */}
          <DirectionButton direction="down" />

          {/* empty */}
          <Box />
        </Grid>
      </Box>
    </WidgetFrame>
  )
}
