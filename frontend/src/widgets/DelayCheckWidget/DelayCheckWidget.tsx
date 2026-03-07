import { Box, Button, HStack, Switch } from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RobotConnector } from "@/mosaic";
import type { ConnectionCheckReceiverStore } from "@/stores/ConnectionCheckReceiverStore/ConnectionCheckReceiverStore.ts";
import type { ConnectionCheckSenderStore } from "@/stores/ConnectionCheckSenderStore/ConnectionCheckSenderStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";
import { useRobotInfo } from "@/hooks/useRobotInfo.ts";

// ~250 KB ASCII string, generated once at module load
const LARGE_PAYLOAD = "x".repeat(250 * 1024);

interface ConnectionCheckData {
  messageCreated: number;
  messageReceived: number;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  const ms = (ts % 1000).toFixed(3).padStart(7, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

function latencyColor(ms: number): string {
  if (ms < 10) return "green.600";
  if (ms < 50) return "yellow.600";
  return "red.600";
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

const TABLE_HEADERS = ["#", "Latency", "Created", "Received"];

export default function DelayCheckWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const { robotInfos } = useRobotInfo();
  const [connectionCheckingMessages, setConnectionCheckingMessages] = useState<
    ConnectionCheckData[]
  >([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [largeMode, setLargeMode] = useState(false);
  const largeModeRef = useRef(false);

  const robotName = useMemo(() => {
    const robotId = widgetConfig.connectors[0]?.robotId;
    const info = robotInfos.find((r) => r.id === robotId);
    return info?.name ?? robotId ?? "robot";
  }, [widgetConfig.connectors, robotInfos]);

  const stats = useMemo(() => {
    if (connectionCheckingMessages.length === 0) return null;
    const latencies = connectionCheckingMessages.map(
      (m) => (m.messageReceived - m.messageCreated) * 0.5,
    );
    const n = latencies.length;
    const mean = latencies.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(latencies.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
    const sorted = [...latencies].sort((a, b) => a - b);
    return {
      mean,
      std,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    };
  }, [connectionCheckingMessages]);

  const handleSave = useCallback(() => {
    const header = "seq,latency_ms,created_ms,received_ms\n";
    const rows = connectionCheckingMessages
      .map((msg, i) => {
        const latency = (msg.messageReceived - msg.messageCreated) * 0.5;
        return `${i + 1},${latency.toFixed(6)},${msg.messageCreated.toFixed(3)},${msg.messageReceived.toFixed(3)}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${robotName}${largeModeRef.current ? "_large" : ""}_delay_stats.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [connectionCheckingMessages, robotName]);

  useEffect(() => {
    let senderConnector: RobotConnector;
    let receiverConnector: RobotConnector;
    const connector = widgetConfig.connectors[0];
    if (connector.connectorId.endsWith("sender")) {
      senderConnector = connector;
      receiverConnector = widgetConfig.connectors[1];
    } else {
      senderConnector = widgetConfig.connectors[1];
      receiverConnector = connector;
    }

    const senderStore = getOrCreateStore(receiverConnector) as ConnectionCheckSenderStore;
    const receiverStore = getOrCreateStore(senderConnector) as ConnectionCheckReceiverStore;

    if (senderStore === null || receiverStore === null) {
      return;
    }

    receiverStore.subscribe((data) => {
      const receivedAt = performance.timeOrigin + performance.now();
      const d: ConnectionCheckData = {
        messageCreated: data.messageCreated,
        messageReceived: receivedAt,
      };
      setConnectionCheckingMessages((prev) => [...prev, d]);
    });
    const delOnAfterConnected = senderStore.onAfterConnected(() => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      intervalRef.current = setInterval(() => {
        senderStore.send({
          messageCreated: performance.timeOrigin + performance.now(),
          ...(largeModeRef.current ? { extra: LARGE_PAYLOAD } : {}),
        });
      }, 500);
    });
    const delOnAfterDisconnected = senderStore.onAfterDisconnected(() => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    });
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      delOnAfterConnected();
      delOnAfterDisconnected();
      releaseStore(connector);
    };
  }, [widgetConfig]);

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <Box display="flex" flexDirection="column" h="100%" w="100%" gap={2}>
        {/* Stats + controls */}
        <HStack px={2} align="center" flexShrink={0} gap={4}>
          {/* Left: stats in two rows */}
          <Box flex={1} minW={0} fontSize="xs" fontFamily="mono">
            <HStack gap={4} mb={0.5}>
              {(["Mean", "Std"] as const).map((label) => (
                <Box key={label} textAlign="center">
                  <Box color="gray.700">{label}</Box>
                  <Box color="cyan.500" fontWeight="semibold" whiteSpace="nowrap">
                    {stats?.[label.toLowerCase() as "mean" | "std"]?.toFixed(3) ?? "—"}
                  </Box>
                </Box>
              ))}
            </HStack>
            <HStack gap={4}>
              {(["p50", "p95", "p99"] as const).map((label) => (
                <Box key={label} textAlign="center">
                  <Box color="gray.700">{label}</Box>
                  <Box color="cyan.500" fontWeight="semibold" whiteSpace="nowrap">
                    {stats?.[label]?.toFixed(3) ?? "—"}
                  </Box>
                </Box>
              ))}
            </HStack>
          </Box>

          {/* Right: [Large + switch] | [Save CSV] */}
          <HStack flexShrink={0} align="center" gap={2}>
            <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
              <Box fontSize="xs" color="gray.500">
                Large
              </Box>
              <Switch.Root
                size="sm"
                checked={largeMode}
                onCheckedChange={(e: { checked: boolean }) => {
                  largeModeRef.current = e.checked;
                  setLargeMode(e.checked);
                }}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            </Box>
            <Button
              size="xs"
              variant="outline"
              colorPalette="teal"
              onClick={handleSave}
              disabled={connectionCheckingMessages.length === 0}
            >
              Save CSV
            </Button>
          </HStack>
        </HStack>

        {/* Data table */}
        <Box overflowY="auto" flex={1} fontSize="xs" fontFamily="mono">
          <Box as="table" w="100%" style={{ borderCollapse: "collapse" }}>
            <Box as="thead" position="sticky" top={0} zIndex={1}>
              <Box as="tr">
                {TABLE_HEADERS.map((col) => (
                  <Box
                    key={col}
                    as="th"
                    px={2}
                    py={1}
                    textAlign="right"
                    color="gray.900"
                    fontWeight="semibold"
                    borderBottom="1px solid"
                    borderColor="gray.500"
                    whiteSpace="nowrap"
                  >
                    {col}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box as="tbody">
              {connectionCheckingMessages.map((msg, i) => {
                const latency = (msg.messageReceived - msg.messageCreated) * 0.5;
                return (
                  <Box
                    key={i}
                    as="tr"
                    bg={i % 2 === 0 ? "transparent" : "whiteAlpha.50"}
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    <Box as="td" px={2} py={0.5} textAlign="right" color="gray.600">
                      {i + 1}
                    </Box>
                    <Box as="td" px={2} py={0.5} textAlign="right" color={latencyColor(latency)}>
                      {latency.toFixed(3)}
                    </Box>
                    <Box as="td" px={2} py={0.5} textAlign="right" color="gray.700">
                      {formatTimestamp(msg.messageCreated)}
                    </Box>
                    <Box as="td" px={2} py={0.5} textAlign="right" color="gray.700">
                      {formatTimestamp(msg.messageReceived)}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </WidgetFrame>
  );
}
