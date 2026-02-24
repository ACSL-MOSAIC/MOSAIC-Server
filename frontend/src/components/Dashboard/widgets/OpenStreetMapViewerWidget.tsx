import { WidgetFrame } from "@/components/Dashboard/WidgetFrame.tsx"
import type { WidgetProps } from "@/components/Dashboard/widgets/index.ts"
import { useMosaicStore } from "@/hooks/useMosaicStore.ts"
import type JsonReceivableStore from "@/mosaic/store/impl/json-receivable-store.ts"
import { Box, Text } from "@chakra-ui/react"
import type { Map as LeafletMap } from "leaflet"
import L from "leaflet"
import { useEffect, useRef, useState } from "react"
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"

type GpsCoordinate = {
  latitude: number
  longitude: number
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
  const mapRef = useRef<LeafletMap | null>(null)
  const hasCenteredRef = useRef(false)
  const connector = widgetConfig.connectors[0]
  const connectorRobotId = connector?.robotId ?? ""
  const connectorId = connector?.connectorId ?? ""
  const [coordinate, setCoordinate] = useState<GpsCoordinate | null>(null)
  const [hasInvalidPayload, setHasInvalidPayload] = useState(false)

  useEffect(() => {
    if (!connector || !connectorRobotId || !connectorId) {
      return
    }

    const store = getOrCreateStore(connector) as JsonReceivableStore
    if (store === null) {
      return
    }

    const unsubscribe = store.subscribe((incoming) => {
      const parsed = parseGpsCoordinate(incoming)
      if (!parsed) {
        setHasInvalidPayload(true)
        return
      }
      setHasInvalidPayload(false)
      setCoordinate(parsed)
    })

    return () => {
      unsubscribe()
      releaseStore(connector)
    }
  }, [connector, connectorRobotId, connectorId, getOrCreateStore, releaseStore])

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

  const statusText = (() => {
    if (!connector || !connectorRobotId || !connectorId) {
      return "No GPS connector configured."
    }
    if (hasInvalidPayload) {
      return "Waiting for valid GPS payload..."
    }
    if (!coordinate) {
      return "Waiting for GPS data..."
    }
    return `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`
  })()

  return (
    <WidgetFrame widgetConfig={widgetConfig}>
      <Box h="100%" position="relative">
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
          {coordinate && (
            <Marker
              position={[coordinate.latitude, coordinate.longitude]}
              icon={robotMarkerIcon}
            >
              <Popup>
                <Text fontSize="sm" fontWeight="semibold">
                  {connectorRobotId}
                </Text>
                <Text fontSize="xs">
                  {coordinate.latitude.toFixed(6)},{" "}
                  {coordinate.longitude.toFixed(6)}
                </Text>
              </Popup>
            </Marker>
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
          <Text fontSize="xs" color="gray.700" truncate>
            {statusText}
          </Text>
        </Box>
      </Box>
    </WidgetFrame>
  )
}
