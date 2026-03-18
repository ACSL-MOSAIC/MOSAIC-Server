import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import type { SendableStore } from "@/mosaic/store/interface/sendable-store.ts";
import type { Thumbstick } from "@/stores/@types/thumbstick.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { WidgetRoot } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";

const SEND_INTERVAL_MS = 30;
const KNOB_SIZE_RATIO = 0.2; // knob diameter as fraction of pad width

function toThumbstick(dx: number, dy: number, holonomic: boolean, maxRadius: number): Thumbstick {
  const dist = Math.sqrt(dx * dx + dy * dy);
  const power = Math.min(dist / maxRadius, 1);
  let angle = Math.atan2(dx, -dy); // 0=up, π/2=right, π=down, 3π/2=left
  if (angle < 0) angle += 2 * Math.PI;
  return { angle, power, holonomic };
}

export default function ThumbstickSenderWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore } = useMosaicStore();
  const storeRef = useRef<SendableStore<Thumbstick> | null>(null);
  const [holonomic, setHolonomic] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thumbstickRef = useRef<Thumbstick>({
    angle: 0,
    power: 0,
    holonomic: false,
  });
  const holonomicRef = useRef(false);
  const padRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const connector = widgetConfig.connectors[0];
    storeRef.current = getOrCreateStore(connector) as SendableStore<Thumbstick>;
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // releaseStore(connector)
    };
  }, [widgetConfig]);

  // Keep holonomicRef in sync with state for use inside interval callback
  useEffect(() => {
    holonomicRef.current = holonomic;
  }, [holonomic]);

  const updateKnob = (clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const maxRadius = (rect.width * (1 - KNOB_SIZE_RATIO)) / 2;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnobPos({ x: dx, y: dy });
    thumbstickRef.current = toThumbstick(dx, dy, holonomicRef.current, maxRadius);
  };

  const resetKnob = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setKnobPos({ x: 0, y: 0 });
    const zero: Thumbstick = {
      angle: 0,
      power: 0,
      holonomic: holonomicRef.current,
    };
    thumbstickRef.current = zero;
    storeRef.current?.send(zero);
  };

  return (
    <WidgetRoot widgetConfig={widgetConfig}>
      <Box display="flex" flexDirection="column" h="100%" w="100%" gap={2}>
        {/* Container that fills available space */}
        <Box flex={1} minH={0} display="flex" alignItems="center" justifyContent="center">
          <Box
            ref={padRef}
            w="100%"
            style={{ aspectRatio: "1", maxHeight: "100%" }}
            borderRadius="full"
            bg="bg.subtle"
            borderWidth="2px"
            borderColor="border.subtle"
            position="relative"
            cursor="crosshair"
            userSelect="none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              isDraggingRef.current = true;
              setIsDragging(true);
              updateKnob(e.clientX, e.clientY);
              if (intervalRef.current === null) {
                intervalRef.current = setInterval(() => {
                  storeRef.current?.send(thumbstickRef.current);
                }, SEND_INTERVAL_MS);
              }
            }}
            onPointerMove={(e) => {
              if (!isDraggingRef.current) return;
              updateKnob(e.clientX, e.clientY);
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
              w={`${KNOB_SIZE_RATIO * 100}%`}
              h={`${KNOB_SIZE_RATIO * 100}%`}
              borderRadius="full"
              bg={isDragging ? "blue.400" : "blue.600"}
              boxShadow={isDragging ? "0 0 12px rgba(66,153,225,0.6)" : "none"}
              pointerEvents="none"
              style={{
                left: `calc(50% + ${knobPos.x}px)`,
                top: `calc(50% + ${knobPos.y}px)`,
                transform: "translate(-50%, -50%)",
                transition: isDragging
                  ? "none"
                  : "left 0.15s ease-out, top 0.15s ease-out, box-shadow 0.15s",
              }}
            />
          </Box>
        </Box>

        {/* Holonomic toggle */}
        <Box flexShrink={0} display="flex" justifyContent="center" pb={1}>
          <Checkbox checked={holonomic} onCheckedChange={(e) => setHolonomic(!!e.checked)}>
            Holonomic
          </Checkbox>
        </Box>
      </Box>
    </WidgetRoot>
  );
}
