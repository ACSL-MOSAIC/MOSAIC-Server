import { Box, Grid, HStack, Text, VStack } from "@chakra-ui/react";
import { Edges, GizmoHelper, GizmoViewport, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";

import type { JsonReceivableStore } from "@/stores/JsonReceivableStore/JsonReceivableStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";

interface ImuData {
  angular_velocity: [number, number, number];
  linear_acceleration: [number, number, number];
  orientation: [number, number, number, number]; // [w, x, y, z]
  position?: [number, number, number];
}

const AXIS_COLORS = ["#ef4444", "#22c55e", "#3b82f6"] as const; // X=red Y=green Z=blue

// Isaac Sim is Z-up, Three.js is Y-up → correct by -90° around X axis
const ZUP_TO_YUP = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2,
);

// orientation: [w, x, y, z] → apply Z-up correction, then build THREE.Quaternion
function RobotModel({ orientation }: { orientation: [number, number, number, number] }) {
  const [w, x, y, z] = orientation;
  const q = ZUP_TO_YUP.clone().multiply(new THREE.Quaternion(x, y, z, w));
  return (
    <group quaternion={q}>
      {/* Main chassis */}
      <mesh>
        <boxGeometry args={[2.2, 0.45, 3]} />
        <meshStandardMaterial color="#1e3a5f" transparent opacity={0.85} />
        <Edges color="#60a5fa" />
      </mesh>
    </group>
  );
}

function ValueBar({
  label,
  value,
  max,
  color,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit: string;
}) {
  const pct = `${Math.min(Math.abs(value) / max, 1) * 100}%`;
  const isPos = value >= 0;

  return (
    <HStack gap={2} w="100%">
      <Text fontSize="xs" fontWeight="bold" color={color} w="4" flexShrink={0}>
        {label}
      </Text>
      {/* Centered bidirectional bar */}
      <HStack flex={1} gap={0} h="8px" borderRadius="sm" bg="bg.subtle" overflow="hidden">
        {/* Left half: negative values */}
        <Box flex={1} h="100%" position="relative" overflow="hidden">
          {!isPos && (
            <Box position="absolute" right="0" top="0" h="100%" w={pct} bg={color} opacity={0.75} />
          )}
        </Box>
        {/* Center divider */}
        <Box h="100%" w="1px" bg="border.subtle" flexShrink={0} />
        {/* Right half: positive values */}
        <Box flex={1} h="100%" position="relative" overflow="hidden">
          {isPos && (
            <Box position="absolute" left="0" top="0" h="100%" w={pct} bg={color} opacity={0.75} />
          )}
        </Box>
      </HStack>
      <Text
        fontSize="xs"
        fontFamily="mono"
        w="20"
        textAlign="right"
        flexShrink={0}
        whiteSpace="nowrap"
      >
        {value.toFixed(3)}
        <Text as="span" color="fg.muted">
          {" "}
          {unit}
        </Text>
      </Text>
    </HStack>
  );
}

export default function ImuState3DViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const [data, setData] = useState<ImuData | null>(null);

  useEffect(() => {
    const connector = widgetConfig.connectors[0];
    if (!connector) return;

    const store = getOrCreateStore(connector) as JsonReceivableStore;
    if (store === null) return;

    const unsubscribe = store.subscribe((incoming) => setData(incoming as ImuData));

    return () => {
      unsubscribe();
      releaseStore(connector);
    };
  }, [widgetConfig]);

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <VStack align="stretch" h="100%" gap={0}>
        {/* 3D Orientation Viewer */}
        <Box flex={1} minH={0}>
          <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 8, 5]} intensity={1.2} />
            <axesHelper args={[2.5]} />
            {data && <RobotModel orientation={data.orientation} />}
            <OrbitControls enablePan={false} />
            <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
              <GizmoViewport
                axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
                labelColor="transparent"
              />
            </GizmoHelper>
          </Canvas>
        </Box>

        {/* Sensor Values */}
        <Grid
          templateColumns="repeat(2, 1fr)"
          gap={3}
          p={3}
          borderTopWidth="1px"
          borderColor="border.subtle"
        >
          <VStack align="stretch" gap={1.5}>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Angular Velocity
            </Text>
            {(["X", "Y", "Z"] as const).map((axis, i) => (
              <ValueBar
                key={axis}
                label={axis}
                value={data?.angular_velocity[i] ?? 0}
                max={3}
                color={AXIS_COLORS[i]}
                unit="rad/s"
              />
            ))}
          </VStack>

          <VStack align="stretch" gap={1.5}>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Linear Accel
            </Text>
            {(["X", "Y", "Z"] as const).map((axis, i) => (
              <ValueBar
                key={axis}
                label={axis}
                value={data?.linear_acceleration[i] ?? 0}
                max={15}
                color={AXIS_COLORS[i]}
                unit="m/s²"
              />
            ))}
          </VStack>
        </Grid>
      </VStack>
    </WidgetFrame>
  );
}
