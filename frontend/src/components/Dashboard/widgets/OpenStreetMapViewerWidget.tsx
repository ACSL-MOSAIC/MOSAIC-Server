import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import type { WidgetProps } from "@/components/Dashboard/widgets/index.ts"
import { useMosaicStore } from "@/hooks/useMosaicStore.ts"
import { useRobotInfo } from "@/hooks/useRobotInfo.ts"
import type JsonReceivableStore from "@/mosaic/store/impl/json-receivable-store.ts"
import { Box, Button, Text, VStack } from "@chakra-ui/react"
import type { Map as LeafletMap } from "leaflet"
import L from "leaflet"
import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type GpsCoordinate = {
  latitude: number
  longitude: number
}

type RobotGpsState = {
  coordinate: GpsCoordinate | null
  hasInvalidPayload: boolean
}

const DEFAULT_CENTER: [number, number] = [36.3504, 127.3845]
const DEFAULT_ZOOM = 13
const TRACKING_ZOOM = 16

const robotMarkerIcon = L.icon({
  iconUrl: "/assets/images/marker-icon.png",
  iconRetinaUrl: "/assets/images/marker-icon-2x.png",
  shadowUrl: "/assets/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

const parseGpsCoordinate = (payload: unknown): GpsCoordinate | null => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null
  }

  const data = payload as Record<string, unknown>
  const directLatitude = toFiniteNumber(data.latitude ?? data.lat)
  const directLongitude = toFiniteNumber(data.longitude ?? data.lng ?? data.lon)

  if (directLatitude !== null && directLongitude !== null) {
    return {
      latitude: directLatitude,
      longitude: directLongitude,
    }
  }

  const nestedCoordinate = data.coordinate
  if (
    nestedCoordinate &&
    typeof nestedCoordinate === "object" &&
    !Array.isArray(nestedCoordinate)
  ) {
    const nested = nestedCoordinate as Record<string, unknown>
    const nestedLatitude = toFiniteNumber(nested.latitude ?? nested.lat)
    const nestedLongitude = toFiniteNumber(
      nested.longitude ?? nested.lng ?? nested.lon,
    )
    if (nestedLatitude !== null && nestedLongitude !== null) {
      return {
        latitude: nestedLatitude,
        longitude: nestedLongitude,
      }
    }
  }

  return null
}

export default function OpenStreetMapViewerWidget({
  widgetConfig,
}: WidgetProps) {
  const { getOrCreateStore, releaseStore } = useMosaicStore()
  const { robotInfos } = useRobotInfo()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const hasCenteredRef = useRef(false)
  const [robotGpsStateMap, setRobotGpsStateMap] = useState<
    Record<string, RobotGpsState>
  >({})
  const [selectedRobotId, setSelectedRobotId] = useState<string>("")

  const connectors = useMemo(() => {
    const seen = new Set<string>()
    return widgetConfig.connectors.filter((item) => {
      if (!item?.robotId || !item?.connectorId) {
        return false
      }
      const key = `${item.robotId}:${item.connectorId}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }, [widgetConfig.connectors])

  const robotNameById = useMemo(() => {
    const map: Record<string, string> = {}
    robotInfos.forEach((item) => {
      map[item.id] = item.name
    })
    return map
  }, [robotInfos])

  const robotIds = useMemo(
    () => [...new Set(connectors.map((item) => item.robotId))],
    [connectors],
  )
  const robotsWithCoordinate = useMemo(
    () =>
      robotIds.flatMap((robotId) => {
        const coordinate = robotGpsStateMap[robotId]?.coordinate
        if (!coordinate) {
          return []
        }
        return [{ robotId, coordinate }]
      }),
    [robotGpsStateMap, robotIds],
  )

  const primaryRobotId = connectors[0]?.robotId ?? ""
  const primaryRobotState = primaryRobotId
    ? robotGpsStateMap[primaryRobotId]
    : undefined
  const firstRobotWithCoordinate = robotsWithCoordinate[0]
  const activeRobotId =
    selectedRobotId.length > 0 &&
    robotGpsStateMap[selectedRobotId]?.coordinate !== null &&
    robotGpsStateMap[selectedRobotId]?.coordinate
      ? selectedRobotId
      : primaryRobotState?.coordinate !== null && primaryRobotState?.coordinate
        ? primaryRobotId
        : (firstRobotWithCoordinate?.robotId ?? "")
  const coordinate =
    activeRobotId.length > 0
      ? (robotGpsStateMap[activeRobotId]?.coordinate ?? null)
      : null
  const hasAnyInvalidPayload = connectors.some(
    (item) => robotGpsStateMap[item.robotId]?.hasInvalidPayload ?? false,
  )

  useEffect(() => {
    if (connectors.length === 0) {
      setRobotGpsStateMap({})
      setSelectedRobotId("")
      return
    }

    setRobotGpsStateMap((prev) => {
      const next: Record<string, RobotGpsState> = {}
      connectors.forEach((item) => {
        next[item.robotId] = prev[item.robotId] ?? {
          coordinate: null,
          hasInvalidPayload: false,
        }
      })
      return next
    })

    const cleanups: Array<() => void> = []
    connectors.forEach((item) => {
      const store = getOrCreateStore(item) as JsonReceivableStore
      if (store === null) {
        return
      }

      const unsubscribe = store.subscribe((incoming) => {
        const parsed = parseGpsCoordinate(incoming)
        setRobotGpsStateMap((prev) => ({
          ...prev,
          [item.robotId]: {
            coordinate: parsed,
            hasInvalidPayload: parsed === null,
          },
        }))
      })

      cleanups.push(() => {
        unsubscribe()
        releaseStore(item)
      })
    })

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [connectors, getOrCreateStore, releaseStore])

  useEffect(() => {
    if (connectors.length === 0) {
      return
    }

    const hasSelected = connectors.some(
      (item) => item.robotId === selectedRobotId,
    )
    if (hasSelected) {
      return
    }

    setSelectedRobotId(connectors[0].robotId)
  }, [connectors, selectedRobotId])

  useEffect(() => {
    if (!mapRef.current || !coordinate) {
      return
    }

    const nextCenter: [number, number] = [
      coordinate.latitude,
      coordinate.longitude,
    ]
    if (!hasCenteredRef.current) {
      mapRef.current.setView(nextCenter, TRACKING_ZOOM)
      hasCenteredRef.current = true
      return
    }

    mapRef.current.panTo(nextCenter)
  }, [coordinate])

  useEffect(() => {
    if (!containerRef.current || !mapRef.current) {
      return
    }

    const map = mapRef.current
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize()
    })

    resizeObserver.observe(containerRef.current)
    map.invalidateSize()

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  const flyToRobot = (robotId: string) => {
    setSelectedRobotId(robotId)
    const targetCoordinate = robotGpsStateMap[robotId]?.coordinate
    if (!mapRef.current || !targetCoordinate) {
      return
    }

    mapRef.current.flyTo(
      [targetCoordinate.latitude, targetCoordinate.longitude],
      TRACKING_ZOOM,
    )
    hasCenteredRef.current = true
  }

  const statusText = (() => {
    if (connectors.length === 0) {
      return "No GPS connector configured."
    }
    if (!coordinate && hasAnyInvalidPayload) {
      return "Waiting for valid GPS payload..."
    }
    if (!coordinate) {
      return "Waiting for GPS data..."
    }
    const activeRobotName = robotNameById[activeRobotId] ?? activeRobotId
    return `${activeRobotName}: ${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`
  })()

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <Box ref={containerRef} h="100%" position="relative">
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
          {robotsWithCoordinate.map(
            ({ robotId, coordinate: markerCoordinate }) => (
              <Marker
                key={robotId}
                position={[
                  markerCoordinate.latitude,
                  markerCoordinate.longitude,
                ]}
                icon={robotMarkerIcon}
                eventHandlers={{
                  click: () => {
                    flyToRobot(robotId)
                  },
                }}
              >
                <Popup>
                  <Text fontSize="sm" fontWeight="semibold">
                    {robotNameById[robotId] ?? robotId}
                  </Text>
                  <Text fontSize="xs">
                    {markerCoordinate.latitude.toFixed(6)},{" "}
                    {markerCoordinate.longitude.toFixed(6)}
                  </Text>
                </Popup>
              </Marker>
            ),
          )}
        </MapContainer>

        <Box
          position="absolute"
          left={3}
          bottom={3}
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
              const robotName = robotNameById[robotId] ?? robotId
              const hasCoordinate = !!robotGpsStateMap[robotId]?.coordinate
              const isSelected = robotId === activeRobotId

              return (
                <Button
                  key={robotId}
                  size="2xs"
                  justifyContent="flex-start"
                  variant={isSelected ? "solid" : "ghost"}
                  colorScheme={isSelected ? "green" : "gray"}
                  onClick={() => {
                    flyToRobot(robotId)
                  }}
                  disabled={!hasCoordinate}
                >
                  <Text fontSize="xs" truncate>
                    {robotName}
                  </Text>
                </Button>
              )
            })}
            <Text fontSize="xs" color="gray.700" truncate>
              {statusText}
            </Text>
          </VStack>
        </Box>
      </Box>
    </WidgetFrame>
  )
}
