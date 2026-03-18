import type { Map as LeafletMap } from "leaflet";

import { Box, Button, Text, VStack } from "@chakra-ui/react";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import type { JsonReceivableStore } from "@/stores/JsonReceivableStore/JsonReceivableStore.ts";
import type { WidgetProps } from "@/widgets/index.ts";

import { WidgetRoot } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { useMosaicStore } from "@/hooks/useMosaicStore.ts";
import { useRobotInfo } from "@/hooks/useRobotInfo.ts";
import "leaflet/dist/leaflet.css";

type GpsCoordinate = {
  latitude: number;
  longitude: number;
};

type RobotGpsState = {
  coordinate: GpsCoordinate | null;
  hasInvalidPayload: boolean;
};

const DEFAULT_CENTER: [number, number] = [36.3504, 127.3845];
const DEFAULT_ZOOM = 13;
const TRACKING_ZOOM = 16;

const robotMarkerIcon = L.icon({
  iconUrl: "/assets/images/marker-icon.png",
  iconRetinaUrl: "/assets/images/marker-icon-2x.png",
  shadowUrl: "/assets/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const parseGpsCoordinate = (payload: unknown): GpsCoordinate | null => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const directLatitude = toFiniteNumber(data.latitude ?? data.lat);
  const directLongitude = toFiniteNumber(data.longitude ?? data.lng ?? data.lon);

  if (directLatitude !== null && directLongitude !== null) {
    return {
      latitude: directLatitude,
      longitude: directLongitude,
    };
  }

  const nestedCoordinate = data.coordinate;
  if (
    nestedCoordinate &&
    typeof nestedCoordinate === "object" &&
    !Array.isArray(nestedCoordinate)
  ) {
    const nested = nestedCoordinate as Record<string, unknown>;
    const nestedLatitude = toFiniteNumber(nested.latitude ?? nested.lat);
    const nestedLongitude = toFiniteNumber(nested.longitude ?? nested.lng ?? nested.lon);
    if (nestedLatitude !== null && nestedLongitude !== null) {
      return {
        latitude: nestedLatitude,
        longitude: nestedLongitude,
      };
    }
  }

  return null;
};

export default function OpenStreetMapViewerWidget({ widgetConfig }: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore();
  const { robotInfos } = useRobotInfo();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [robotGpsStateMap, setRobotGpsStateMap] = useState<Record<string, RobotGpsState>>({});
  const [selectedRobotId, setSelectedRobotId] = useState<string>("");

  const connectors = widgetConfig.connectors;

  const robotNameById = useMemo(() => {
    const map: Record<string, string> = {};
    robotInfos.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }, [robotInfos]);

  const robotIds = useMemo(() => {
    return [...new Set(connectors.map((item) => item.robotId))];
  }, [connectors]);

  const selectorPanelWidth = useMemo(() => {
    const longestRobotNameLength = robotIds.reduce((max, robotId) => {
      const robotName = robotNameById[robotId] ?? robotId;
      return Math.max(max, Array.from(robotName).length);
    }, 0);
    const widthInCh = Math.max(longestRobotNameLength + 2, 16);
    return `${widthInCh}ch`;
  }, [robotIds, robotNameById]);

  const robotsWithCoordinate = useMemo(
    () =>
      robotIds.flatMap((robotId) => {
        const coordinate = robotGpsStateMap[robotId]?.coordinate;
        if (!coordinate) {
          return [];
        }
        return [{ robotId, coordinate }];
      }),
    [robotGpsStateMap, robotIds],
  );

  const primaryRobotId = connectors[0]?.robotId ?? "";
  const primaryRobotState = primaryRobotId ? robotGpsStateMap[primaryRobotId] : undefined;
  const firstRobotWithCoordinate = robotsWithCoordinate[0];
  const activeRobotId =
    selectedRobotId.length > 0 &&
    robotGpsStateMap[selectedRobotId]?.coordinate !== null &&
    robotGpsStateMap[selectedRobotId]?.coordinate
      ? selectedRobotId
      : primaryRobotState?.coordinate !== null && primaryRobotState?.coordinate
        ? primaryRobotId
        : (firstRobotWithCoordinate?.robotId ?? "");

  useEffect(() => {
    if (connectors.length === 0) {
      setRobotGpsStateMap({});
      setSelectedRobotId("");
      return;
    }

    setRobotGpsStateMap((prev) => {
      const next: Record<string, RobotGpsState> = {};
      connectors.forEach((item) => {
        next[item.robotId] = prev[item.robotId] ?? {
          coordinate: null,
          hasInvalidPayload: false,
        };
      });
      return next;
    });

    const cleanups: Array<() => void> = [];
    connectors.forEach((item) => {
      const store = getOrCreateStore(item) as JsonReceivableStore;
      if (store === null) {
        return;
      }

      const unsubscribe = store.subscribe((incoming) => {
        const parsed = parseGpsCoordinate(incoming);
        setRobotGpsStateMap((prev) => ({
          ...prev,
          [item.robotId]: {
            coordinate: parsed,
            hasInvalidPayload: parsed === null,
          },
        }));
      });

      cleanups.push(() => {
        unsubscribe();
        releaseStore(item);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [connectors, getOrCreateStore, releaseStore]);

  useEffect(() => {
    if (connectors.length === 0) {
      return;
    }

    const hasSelected = connectors.some((item) => item.robotId === selectedRobotId);
    if (hasSelected) {
      return;
    }

    setSelectedRobotId(connectors[0].robotId);
  }, [connectors, selectedRobotId]);

  useEffect(() => {
    if (!containerRef.current || !mapRef.current) {
      return;
    }

    const map = mapRef.current;
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(containerRef.current);
    map.invalidateSize();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const centerMapOnRobot = (robotId: string) => {
    setSelectedRobotId(robotId);
    const targetCoordinate = robotGpsStateMap[robotId]?.coordinate;
    if (!mapRef.current || !targetCoordinate) {
      return;
    }

    mapRef.current.flyTo([targetCoordinate.latitude, targetCoordinate.longitude], TRACKING_ZOOM);
  };

  return (
    <WidgetRoot widgetConfig={widgetConfig} useBody={false} showRobotInfo={false}>
      <Box ref={containerRef} flex="1" minH="0" position="relative">
        <MapContainer
          ref={mapRef}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {robotsWithCoordinate.map(({ robotId, coordinate: markerCoordinate }) => (
            <Marker
              key={robotId}
              position={[markerCoordinate.latitude, markerCoordinate.longitude]}
              icon={robotMarkerIcon}
              eventHandlers={{
                click: () => {
                  centerMapOnRobot(robotId);
                },
              }}
            >
              <Popup>
                <Text fontSize="sm" fontWeight="semibold">
                  {robotNameById[robotId] ?? robotId}
                </Text>
                <Text fontSize="xs">
                  {markerCoordinate.latitude.toFixed(6)}, {markerCoordinate.longitude.toFixed(6)}
                </Text>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <Box
          position="absolute"
          left={3}
          bottom={3}
          w={selectorPanelWidth}
          px={3}
          py={2}
          bg="rgba(255,255,255,0.9)"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          zIndex={400}
          maxW="calc(100% - 24px)"
        >
          <VStack align="stretch" gap={2}>
            {robotIds.map((robotId) => {
              const robotName = robotNameById[robotId] ?? robotId;
              const hasCoordinate = !!robotGpsStateMap[robotId]?.coordinate;
              const isSelected = robotId === activeRobotId;

              return (
                <Button
                  key={robotId}
                  size="2xs"
                  w="100%"
                  justifyContent="flex-start"
                  variant={isSelected ? "solid" : "ghost"}
                  colorScheme={isSelected ? "green" : "gray"}
                  onClick={() => {
                    centerMapOnRobot(robotId);
                  }}
                  disabled={!hasCoordinate}
                >
                  <Text fontSize="xs" truncate>
                    {robotName}
                  </Text>
                </Button>
              );
            })}
          </VStack>
        </Box>
      </Box>
    </WidgetRoot>
  );
}
