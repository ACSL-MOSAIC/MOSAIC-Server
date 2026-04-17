import type { ReactNode } from "react";

import { Badge, Box, Grid, HStack, Separator, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { MdBatteryFull, MdPower } from "react-icons/md";

import type { JsonReceivableStore } from "@/stores/JsonReceivableStore/JsonReceivableStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";

interface PowerData {
  battery_connected: number;
  charger_connected: number;
  measured_currents: {
    left_driver_current: string;
    mcu_and_user_port_current: string;
    right_driver_current: string;
  };
  measured_voltages: {
    battery_voltage: string;
    left_driver_voltage: string;
    right_driver_voltage: string;
  };
  timestamp: number;
}

function parseUnit(str: string): { value: string; unit: string } {
  return {
    value: Number.parseFloat(str).toFixed(2),
    unit: str.replace(/[\d.]/g, "").trim(),
  };
}

function formatTimestamp(micros: number): string {
  const date = new Date(micros / 1000);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function StatCard({ label, rawValue }: { label: string; rawValue: string }) {
  const { value, unit } = parseUnit(rawValue);
  return (
    <Box
      bg="bg.subtle"
      borderRadius="md"
      px={3}
      py={2}
      borderWidth="1px"
      borderColor="border.subtle"
    >
      <HStack justify="space-between" align="baseline">
        <Text fontSize="xs" color="fg.muted">
          {label}
        </Text>
        <HStack gap={0.5} align="baseline">
          <Text fontSize="sm" fontWeight="semibold" fontFamily="mono">
            {value}
          </Text>
          <Text fontSize="xs" color="fg.muted" fontFamily="mono">
            {unit}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
}

function StatusRow({
  icon,
  label,
  connected,
}: {
  icon: ReactNode;
  label: string;
  connected: boolean;
}) {
  return (
    <HStack gap={2}>
      <Box color={connected ? "green.400" : "fg.muted"} display="flex">
        {icon}
      </Box>
      <Text fontSize="sm" flex={1}>
        {label}
      </Text>
      <Badge size="sm" colorPalette={connected ? "green" : "gray"} variant="subtle">
        {connected ? "Connected" : "Disconnected"}
      </Badge>
    </HStack>
  );
}

export default function ClearpathPlatformPowerViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const [data, setData] = useState<PowerData | null>(null);

  useEffect(() => {
    const connector = widgetConfig.connectors[0];
    if (!connector) return;

    const store = getOrCreateStore(connector) as JsonReceivableStore;
    if (store === null) return;

    const unsubscribe = store.subscribe((incoming) => setData(incoming as PowerData));

    return () => {
      unsubscribe();
      releaseStore(connector);
    };
  }, [widgetConfig]);

  return (
    <MosaicWidget.Root widgetConfig={widgetConfig}>
      <MosaicWidget.Body>
        {!data ? (
          <Box display="flex" alignItems="center" justifyContent="center" h="100%">
            <Text color="fg.muted" fontSize="sm">
              Waiting for data...
            </Text>
          </Box>
        ) : (
          <VStack align="stretch" gap={3} p={3} h="100%" overflowY="auto">
            {/* Connection Status */}
            <VStack align="stretch" gap={2}>
              <StatusRow
                icon={<MdBatteryFull size={18} />}
                label="Battery"
                connected={data.battery_connected === 1}
              />
              <StatusRow
                icon={<MdPower size={18} />}
                label="Charger"
                connected={data.charger_connected === 1}
              />
            </VStack>

            <Separator />

            {/* Voltages | Currents */}
            <Grid templateColumns="repeat(2, 1fr)" gap={4} flex={1}>
              <VStack align="stretch" gap={2}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Voltages
                </Text>
                <StatCard label="Battery" rawValue={data.measured_voltages.battery_voltage} />
                <StatCard
                  label="Left Driver"
                  rawValue={data.measured_voltages.left_driver_voltage}
                />
                <StatCard
                  label="Right Driver"
                  rawValue={data.measured_voltages.right_driver_voltage}
                />
              </VStack>

              <VStack align="stretch" gap={2}>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Currents
                </Text>
                <StatCard
                  label="Left Driver"
                  rawValue={data.measured_currents.left_driver_current}
                />
                <StatCard
                  label="MCU & Port"
                  rawValue={data.measured_currents.mcu_and_user_port_current}
                />
                <StatCard
                  label="Right Driver"
                  rawValue={data.measured_currents.right_driver_current}
                />
              </VStack>
            </Grid>

            <Separator />

            {/* Timestamp */}
            <Text fontSize="xs" color="fg.subtle" fontFamily="mono">
              {formatTimestamp(data.timestamp)}
            </Text>
          </VStack>
        )}
      </MosaicWidget.Body>
    </MosaicWidget.Root>
  );
}
