import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import type { WidgetProps } from "@/components/Dashboard/widgets/index.ts"
import { Checkbox } from "@/components/ui/checkbox.tsx"
import { useMosaicStore } from "@/hooks/useMosaicStore.ts"
import type { SendableStore } from "@/mosaic/store/interface/sendable-store.ts"
import type { Thumbstick } from "@/mosaic/store/type/thumbstick.ts"
import { Box, VStack } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"

const SEND_INTERVAL_MS = 30
const PAD_SIZE = 160
const KNOB_SIZE = 44
const MAX_RADIUS = (PAD_SIZE - KNOB_SIZE) / 2

function toThumbstick(dx: number, dy: number, holonomic: boolean): Thumbstick {
  const dist = Math.sqrt(dx * dx + dy * dy)
  const power = Math.min(dist / MAX_RADIUS, 1)
  let angle = Math.atan2(dx, -dy) // 0=up, π/2=right, π=down, 3π/2=left
  if (angle < 0) angle += 2 * Math.PI
  return { angle, power, holonomic }
}

export default function ThumbstickSenderWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore } = useMosaicStore()
  const storeRef = useRef<SendableStore<Thumbstick> | null>(null)
  const [holonomic, setHolonomic] = useState(false)
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const thumbstickRef = useRef<Thumbstick>({
    angle: 0,
    power: 0,
    holonomic: false,
  })
  const holonomicRef = useRef(false)
  const padRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const connector = widgetConfig.connectors[0]
    storeRef.current = getOrCreateStore(connector) as SendableStore<Thumbstick>
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // releaseStore(connector)
    }
  }, [widgetConfig])

  // Keep holonomicRef in sync with state for use inside interval callback
  useEffect(() => {
    holonomicRef.current = holonomic
  }, [holonomic])

  const updateKnob = (clientX: number, clientY: number) => {
    if (!padRef.current) return
    const rect = padRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let dx = clientX - cx
    let dy = clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > MAX_RADIUS) {
      dx = (dx / dist) * MAX_RADIUS
      dy = (dy / dist) * MAX_RADIUS
    }
    setKnobPos({ x: dx, y: dy })
    thumbstickRef.current = toThumbstick(dx, dy, holonomicRef.current)
  }

  const resetKnob = () => {
    isDraggingRef.current = false
    setIsDragging(false)
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setKnobPos({ x: 0, y: 0 })
    const zero: Thumbstick = {
      angle: 0,
      power: 0,
      holonomic: holonomicRef.current,
    }
    thumbstickRef.current = zero
    storeRef.current?.send(zero)
  }

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <VStack h="100%" justify="center" align="center" gap={4} p={3}>
        {/* Thumbstick pad */}
        <Box
          ref={padRef}
          w={`${PAD_SIZE}px`}
          h={`${PAD_SIZE}px`}
          borderRadius="full"
          bg="bg.subtle"
          borderWidth="2px"
          borderColor="border.subtle"
          position="relative"
          cursor="crosshair"
          userSelect="none"
          flexShrink={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            isDraggingRef.current = true
            setIsDragging(true)
            updateKnob(e.clientX, e.clientY)
            if (intervalRef.current === null) {
              intervalRef.current = setInterval(() => {
                console.log(
                  "attempt to send thumbstick:",
                  thumbstickRef.current,
                )
                storeRef.current?.send(thumbstickRef.current)
              }, SEND_INTERVAL_MS)
            }
          }}
          onPointerMove={(e) => {
            if (!isDraggingRef.current) return
            updateKnob(e.clientX, e.clientY)
          }}
          onPointerUp={resetKnob}
          onPointerCancel={resetKnob}
        >
          {/* Crosshair */}
          <Box
            position="absolute"
            left="50%"
            top="0"
            bottom="0"
            w="1px"
            bg="border.subtle"
            transform="translateX(-50%)"
            pointerEvents="none"
          />
          <Box
            position="absolute"
            top="50%"
            left="0"
            right="0"
            h="1px"
            bg="border.subtle"
            transform="translateY(-50%)"
            pointerEvents="none"
          />
          {/* Knob */}
          <Box
            position="absolute"
            w={`${KNOB_SIZE}px`}
            h={`${KNOB_SIZE}px`}
            borderRadius="full"
            bg={isDragging ? "blue.400" : "blue.600"}
            boxShadow={isDragging ? "0 0 12px rgba(66,153,225,0.6)" : "none"}
            pointerEvents="none"
            style={{
              left: `calc(50% + ${knobPos.x}px - ${KNOB_SIZE / 2}px)`,
              top: `calc(50% + ${knobPos.y}px - ${KNOB_SIZE / 2}px)`,
              transition: isDragging
                ? "none"
                : "left 0.15s ease-out, top 0.15s ease-out, box-shadow 0.15s",
            }}
          />
        </Box>

        {/* Holonomic toggle */}
        <Checkbox
          checked={holonomic}
          onCheckedChange={(e) => setHolonomic(!!e.checked)}
        >
          Holonomic
        </Checkbox>
      </VStack>
    </WidgetFrame>
  )
}
