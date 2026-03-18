import { Box, Heading, Separator, Text, VStack } from "@chakra-ui/react";
import { useContext, useRef, useState } from "react";

import type { RobotConfig, WidgetConfig } from "@/mosaic";
import type { MosaicStore } from "@/mosaic/store/interface/mosaic-store.ts";

import { MosaicContext } from "@/contexts/MosaicContext.ts";
import { RobotConnector } from "@/mosaic";
import { RobotInfo } from "@/mosaic/robot-info.ts";
import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";
import { SendableStore } from "@/mosaic/store/interface/sendable-store.ts";

import { StoreDataPanel } from "./StoreDataPanel.tsx";
import { StoreSetupPanel } from "./StoreSetupPanel.tsx";
import { WidgetConfigPanel } from "./WidgetConfigPanel.tsx";
import { WidgetPreviewPanel } from "./WidgetPreviewPanel.tsx";
import { getWidgetDescriptor } from "./widgetRegistry.ts";
import { WidgetSelector } from "./WidgetSelector.tsx";

const TEST_ROBOT_ID = "__widget_test_robot__";

const STORAGE_KEY = "widget_customize_last_selection";

interface StoredSelection {
  widgetType: string;
  connectorId: string;
  connectorType: string;
}

function loadSelection(): StoredSelection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredSelection;
  } catch {}
  return { widgetType: "", connectorId: "/test_connector", connectorType: "" };
}

function saveSelection(selection: StoredSelection) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
}

interface AppliedConfig {
  widgetType: string;
  connectorId: string;
  connectorType: string;
  configKey: number;
  fakeRobotConfig: RobotConfig;
}

export function WidgetCustomizePage() {
  const context = useContext(MosaicContext);
  if (!context) throw new Error("MosaicContext not found");
  const { storeManager, updateRobotInfo } = context;

  // Selector state — initialized from localStorage
  const [widgetType, setWidgetType] = useState(() => loadSelection().widgetType);
  const [connectorId, setConnectorId] = useState(() => loadSelection().connectorId);
  const [connectorType, setConnectorType] = useState(() => loadSelection().connectorType);

  const handleWidgetTypeChange = (type: string) => {
    setWidgetType(type);
    saveSelection({ widgetType: type, connectorId, connectorType });
  };

  const handleConnectorIdChange = (id: string) => {
    setConnectorId(id);
    saveSelection({ widgetType, connectorId: id, connectorType });
  };

  const handleConnectorTypeChange = (type: string) => {
    setConnectorType(type);
    saveSelection({ widgetType, connectorId, connectorType: type });
  };

  // Applied (active) config
  const [appliedConfig, setAppliedConfig] = useState<AppliedConfig | null>(null);

  // Widget params (updated by widget's own setting dialog)
  const [widgetParams, setWidgetParams] = useState<Record<string, any>>({});

  // Widget position (updated by grid drag/resize)
  const [widgetPosition, setWidgetPosition] = useState({ x: 0, y: 0, w: 8, h: 6 });

  // Store interaction
  const [storeType, setStoreType] = useState<"receivable" | "sendable" | "media" | null>(null);
  const [sentDataLog, setSentDataLog] = useState<string[]>([]);

  // Keep refs for cleanup
  const currentStoreRef = useRef<MosaicStore | null>(null);
  const currentConnectorRef = useRef<RobotConnector | null>(null);

  const handleApply = () => {
    if (!widgetType || !connectorId || !connectorType) return;

    // Release previous store
    if (currentConnectorRef.current) {
      storeManager.releaseStore(currentConnectorRef.current);
      currentStoreRef.current = null;
      currentConnectorRef.current = null;
    }

    const connector = new RobotConnector(TEST_ROBOT_ID, connectorId);
    const fakeRobotConfig: RobotConfig = {
      connectors: [{ connectorId, connectorType, params: {} }],
    };

    // Create store before widget renders so the mock DataChannel is ready
    const store = storeManager.getOrCreateStore(connector, fakeRobotConfig);
    if (!store) return;

    currentStoreRef.current = store;
    currentConnectorRef.current = connector;

    // Set up mock DataChannel for SendableStore
    if (store instanceof SendableStore) {
      setSentDataLog([]);
      const mockChannel = {
        readyState: "open" as RTCDataChannelState,
        send: (data: string) => {
          setSentDataLog((prev) =>
            [`[${new Date().toLocaleTimeString()}] ${data}`, ...prev].slice(0, 100),
          );
        },
      } as unknown as RTCDataChannel;
      store.setDataChannel(mockChannel);
    }

    setStoreType(store.getStoreType());
    setWidgetParams({});
    setWidgetPosition({ x: 0, y: 0, w: 8, h: 6 });

    // Register fake robot so useMosaicStore (inside the widget) can find it
    updateRobotInfo(new RobotInfo(TEST_ROBOT_ID, "Test Robot", 6, fakeRobotConfig));

    setAppliedConfig((prev) => ({
      widgetType,
      connectorId,
      connectorType,
      configKey: (prev?.configKey ?? 0) + 1,
      fakeRobotConfig,
    }));
  };

  const handleInjectData = (rawData: string) => {
    const store = currentStoreRef.current;
    if (store instanceof ReceivableStore) {
      store.notifySubscribers(rawData).catch((err) => {
        console.error("Failed to inject data:", err);
      });
    }
  };

  const widgetConfig: WidgetConfig | null = appliedConfig
    ? {
        id: "test-widget",
        type: appliedConfig.widgetType,
        position: widgetPosition,
        connectors: [new RobotConnector(TEST_ROBOT_ID, appliedConfig.connectorId)],
        params: widgetParams,
        onUpdateWidgetParams: (params) => setWidgetParams(params ?? {}),
      }
    : null;

  const isApplyDisabled = !widgetType || !connectorId || !connectorType;

  return (
    <Box h="calc(100vh - 60px)" display="flex" flexDir="row" overflow="hidden">
      {/* Left: Config Panel */}
      <Box
        w="360px"
        flexShrink={0}
        overflowY="auto"
        borderRight="1px solid"
        borderColor="gray.200"
        p={4}
        bg="gray.50"
      >
        <VStack gap={4} align="stretch">
          <Box>
            <Heading size="sm" mb={1}>
              Widget Test Page
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Select a widget and configure a connector to test it live.
            </Text>
          </Box>

          <Separator />

          <WidgetSelector value={widgetType} onChange={handleWidgetTypeChange} />

          <Separator />

          <StoreSetupPanel
            connectorId={connectorId}
            connectorType={connectorType}
            onConnectorIdChange={handleConnectorIdChange}
            onConnectorTypeChange={handleConnectorTypeChange}
            onApply={handleApply}
            isApplyDisabled={isApplyDisabled}
          />

          {appliedConfig && (
            <>
              <Separator />
              <StoreDataPanel
                storeType={storeType}
                defaultInjectData={
                  getWidgetDescriptor(appliedConfig.widgetType)?.getDefaultInjectData() ?? ""
                }
                onInject={handleInjectData}
                sentDataLog={sentDataLog}
                onClearLog={() => setSentDataLog([])}
              />
            </>
          )}

          {widgetConfig && (
            <>
              <Separator />
              <WidgetConfigPanel widgetConfig={widgetConfig} />
            </>
          )}
        </VStack>
      </Box>

      {/* Right: Widget Preview */}
      <Box flex="1" overflowY="auto" p={4} bg="white">
        {widgetConfig ? (
          <WidgetPreviewPanel
            key={appliedConfig!.configKey}
            widgetConfig={widgetConfig}
            onPositionChange={setWidgetPosition}
          />
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" h="100%" color="gray.400">
            <Text>Select a widget and apply a connector config to preview it here.</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
