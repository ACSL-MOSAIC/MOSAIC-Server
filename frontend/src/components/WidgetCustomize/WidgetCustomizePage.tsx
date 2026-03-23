import { Box, Heading, Separator, Text, VStack } from "@chakra-ui/react";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { RobotConfig, WidgetConfig } from "@/mosaic";
import type { MosaicStore } from "@/mosaic/store/interface/mosaic-store.ts";

import { MosaicContext } from "@/contexts/MosaicContext.ts";
import { RobotConnector } from "@/mosaic";
import { RobotInfo } from "@/mosaic/robot-info.ts";
import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";
import { SendableStore } from "@/mosaic/store/interface/sendable-store.ts";
import { MediaStreamStore } from "@/stores/MediaStreamStore/MediaStreamStore.ts";
import { getWidgetDescriptor } from "@/widgets/_utils/widgetRegistry.ts";

import { StoreDataPanel } from "./StoreDataPanel.tsx";
import { StoreSetupPanel } from "./StoreSetupPanel.tsx";
import { WidgetConfigPanel } from "./WidgetConfigPanel.tsx";
import { WidgetPreviewPanel } from "./WidgetPreviewPanel.tsx";
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

  const requiredStoreType = getWidgetDescriptor(widgetType)?.getRequiredStoreType() ?? null;

  const handleWidgetTypeChange = (type: string) => {
    setWidgetType(type);
    setConnectorType("");
    saveSelection({ widgetType: type, connectorId, connectorType: "" });
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

  // Pending apply: set in handleApply, consumed after old widget unmounts
  const [pendingApply, setPendingApply] = useState<{
    widgetType: string;
    connectorId: string;
    connectorType: string;
  } | null>(null);
  const pendingConfigKeyRef = useRef<number>(0);

  // Widget params (updated by widget's own setting dialog)
  const [widgetParams, setWidgetParams] = useState<Record<string, any>>({});

  // Widget position (updated by grid drag/resize)
  const [widgetPosition, setWidgetPosition] = useState({ x: 0, y: 0, w: 8, h: 6 });

  // Store interaction
  const [storeType, setStoreType] = useState<"receivable" | "sendable" | "media" | null>(null);
  const [sentDataLog, setSentDataLog] = useState<{ time: string; data: string }[]>([]);

  // Keep refs for cleanup
  const currentStoreRef = useRef<MosaicStore | null>(null);
  const currentConnectorRef = useRef<RobotConnector | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Phase 2: runs after old widget has unmounted and released its store ref
  useEffect(() => {
    if (pendingApply === null) return;
    if (appliedConfig !== null) return;

    const { widgetType, connectorId, connectorType } = pendingApply;
    setPendingApply(null);

    const connector = new RobotConnector(TEST_ROBOT_ID, connectorId);
    const fakeRobotConfig: RobotConfig = {
      connectors: [{ connectorId, connectorType, params: {} }],
    };

    const store = storeManager.getOrCreateStore(connector, fakeRobotConfig);
    if (!store) return;

    currentStoreRef.current = store;
    currentConnectorRef.current = connector;

    if (store instanceof SendableStore) {
      setSentDataLog([]);
      const mockChannel = {
        readyState: "open" as RTCDataChannelState,
        send: (data: string) => {
          const now = new Date();
          const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
          setSentDataLog((prev) => [{ time, data }, ...prev].slice(0, 100));
        },
      } as unknown as RTCDataChannel;
      store.setDataChannel(mockChannel);
    }

    setStoreType(store.getStoreType());
    setWidgetParams(getWidgetDescriptor(widgetType)?.getDefaultParams() ?? {});
    setWidgetPosition({ x: 0, y: 0, w: 8, h: 6 });

    updateRobotInfo(new RobotInfo(TEST_ROBOT_ID, "Test Robot", 6, fakeRobotConfig));

    pendingConfigKeyRef.current += 1;
    setAppliedConfig({
      widgetType,
      connectorId,
      connectorType,
      configKey: pendingConfigKeyRef.current,
      fakeRobotConfig,
    });
  }, [pendingApply, appliedConfig]);

  const handleApply = () => {
    if (!widgetType || !connectorId || !connectorType) return;

    // Force-delete the store for this connector so Phase 2 always creates a fresh store
    // of the newly selected type. The widget's own cleanup will release its ref gracefully.
    if (currentConnectorRef.current) {
      storeManager.forceDeleteStore(currentConnectorRef.current);
      currentStoreRef.current = null;
      currentConnectorRef.current = null;
    }
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.pause();
      hiddenVideoRef.current.src = "";
      hiddenVideoRef.current = null;
    }

    // Phase 1: unmount old widget so its cleanup releases its store ref,
    // then phase 2 (useEffect above) creates the new store with correct type.
    setAppliedConfig(null);
    setPendingApply({ widgetType, connectorId, connectorType });
  };

  const handleInjectMedia = async (videoUrl: string) => {
    const store = currentStoreRef.current;
    if (!(store instanceof MediaStreamStore)) return;

    // Stop and replace previous hidden video
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.pause();
      hiddenVideoRef.current.src = "";
    }

    const hiddenVideo = document.createElement("video");
    hiddenVideo.src = videoUrl;
    hiddenVideo.loop = true;
    hiddenVideo.muted = true;
    hiddenVideo.crossOrigin = "anonymous";
    hiddenVideoRef.current = hiddenVideo;

    try {
      await hiddenVideo.play();
      const stream = (hiddenVideo as any).captureStream() as MediaStream;
      store.setMediaStream(stream);
      store.notifyAfterConnected(TEST_ROBOT_ID);
    } catch (err) {
      console.error("Failed to capture media stream:", err);
    }
  };

  const handleInjectData = (rawData: string) => {
    const store = currentStoreRef.current;
    if (store instanceof ReceivableStore) {
      store.notifySubscribers(rawData).catch((err) => {
        console.error("Failed to inject data:", err);
      });
    }
  };

  const handleUpdateWidgetParams = useCallback((params?: any) => setWidgetParams(params ?? {}), []);

  const widgetConfig: WidgetConfig | null = useMemo(
    () =>
      appliedConfig
        ? {
            id: "test-widget",
            type: appliedConfig.widgetType,
            position: widgetPosition,
            connectors: [new RobotConnector(TEST_ROBOT_ID, appliedConfig.connectorId)],
            params: widgetParams,
            onUpdateWidgetParams: handleUpdateWidgetParams,
          }
        : null,
    [appliedConfig, widgetPosition, widgetParams, handleUpdateWidgetParams],
  );

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
            allowedStoreType={requiredStoreType}
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
                onInjectMedia={handleInjectMedia}
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
