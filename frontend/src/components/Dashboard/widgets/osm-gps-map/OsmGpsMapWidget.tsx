import {useEffect, useRef, useState} from "react"
import {WidgetFrame} from "../WidgetFrame"
import {MapContainer, TileLayer} from "react-leaflet"
import type {Map as LeafletMap} from "leaflet"
import "leaflet/dist/leaflet.css"
import {OsmGpsMapSetting} from "@/components/Dashboard/widgets/osm-gps-map/OsmGpsMapSetting.tsx"
import {ReadOnlyStoreManager} from "@/dashboard/store/data-channel-store/readonly/read-only-store-manager.ts"
import {
  GPS_COORDINATE_TYPE,
  type ParsedGPSCoordinate,
} from "@/dashboard/parser/gps-coordinate.ts"
import {GPSCoordinateStore} from "@/dashboard/store/data-channel-store/readonly/gps-coordinate.store.ts"
import L from "leaflet"
import {useRobotMapping} from "@/hooks/useRobotMapping.ts"
import markerIcon from "/assets/images/marker-icon.png"
import markerIcon2x from "/assets/images/marker-icon-2x.png"
import markerShadow from "/assets/images/marker-shadow.png"

// Fix Leaflet default marker icon issue with Vite
// biome-ignore lint/performance/noDelete: <explanation>
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

interface OsmGpsMapWidgetProps {
  config: OsmGpsMapWidgetConfig
  onUpdateConfig?: (newConfig: OsmGpsMapWidgetConfig) => void
  setOpenSetting?: (openSetting: boolean) => void
  onRemove?: () => void
  connections?: { [key: string]: boolean }
}

export interface OsmGpsMapWidgetConfig {
  robotIdList: string[]
}

interface RobotGpsCoordinate {
  robotId: string
  coordinate: ParsedGPSCoordinate
}

export function OsmGpsMapWidget({
                                  config,
                                  onUpdateConfig,
                                  onRemove,
                                  connections,
                                }: OsmGpsMapWidgetProps) {
  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance()
  const {getRobotName} = useRobotMapping()

  const mapRef = useRef<LeafletMap>(null)
  const [isReady, setIsReady] = useState(false)
  const [openSetting, setOpenSetting] = useState(false)
  const [storeList] = useState<GPSCoordinateStore[]>([])
  const [robotGpsCoordinates, setRobotGpsCoordinates] = useState<
    RobotGpsCoordinate[]
  >([])

  config.robotIdList.forEach((robotId) => {
    const gpsCoordinateStore = readOnlyStoreManager.createStoreIfNotExists(
      robotId,
      GPS_COORDINATE_TYPE,
      (robotId) => new GPSCoordinateStore(robotId),
    )
    storeList.push(gpsCoordinateStore as GPSCoordinateStore)
  })

  const activeRobotGpsCoordinates = robotGpsCoordinates.filter(
    ({robotId}) => {
      return connections ? connections[robotId] : false
    },
  )

  const onCoordinateUpdate = (robotId: string, coord: ParsedGPSCoordinate) => {
    // 내부 state 에 좌표 저장
    setRobotGpsCoordinates((prev) => {
      const existingIndex = prev.findIndex((item) => item.robotId === robotId)
      if (existingIndex !== -1) {
        // 기존에 있는 로봇의 좌표 업데이트
        const updated = [...prev]
        updated[existingIndex].coordinate = coord
        return updated
      }
      // 새로운 로봇의 좌표 추가
      return [...prev, {robotId, coordinate: coord}]
    })
  }

  useEffect(() => {
    const unsubscribeList: (() => void)[] = []
    storeList.forEach((store) => {
      const unsubscribe = store.subscribe((coord) => {
        onCoordinateUpdate(store.robotId, coord)
      })
      unsubscribeList.push(unsubscribe)
    })
    return () => {
      unsubscribeList.forEach((unsubscribe) => unsubscribe())
    }
  }, [storeList])

  // 모든 로봇의 마커를 재렌더링
  const drawRobotMarker = () => {
    if (!mapRef.current) return
    const map = mapRef.current

    // Clear existing markers
    map.eachLayer((layer) => {
      if ((layer as any)._icon) {
        map.removeLayer(layer)
      }
    })

    // Draw markers for each robot
    activeRobotGpsCoordinates.forEach(({robotId, coordinate}) => {
      if (coordinate.latitude && coordinate.longitude) {
        const name = getRobotName(robotId)
        console.log("Draw marker for robot:", name, coordinate)
        const marker = L.marker([coordinate.latitude, coordinate.longitude], {
          title: name,
        })

        marker.addTo(map).bindTooltip(name)
      }
    })
  }

  const flyToRobot = (robotId: string) => {
    if (!mapRef.current) return
    const map = mapRef.current

    const robot = activeRobotGpsCoordinates.find((r) => r.robotId === robotId)
    if (robot?.coordinate.latitude && robot?.coordinate.longitude) {
      map.flyTo([robot.coordinate.latitude, robot.coordinate.longitude], 15)
    }
  }

  useEffect(() => {
    if (isReady) {
      drawRobotMarker()
    }
  }, [isReady, robotGpsCoordinates])

  const center = {
    lat: 36.17,
    lng: 127.0,
  }

  setInterval(() => {
    if (mapRef.current) {
      mapRef.current.invalidateSize(true)
    }
  }, 200)

  return (
    <>
      <WidgetFrame
        title="Gps Map Widget"
        isConnected={true}
        padding="4"
        onSettingClick={() => {
          setOpenSetting?.(true)
        }}
        onRemove={onRemove}
      >
        <div style={{position: "relative", height: "100%", width: "100%"}}>
          <MapContainer
            center={center}
            zoom={13}
            scrollWheelZoom={true}
            style={{
              height: "100%",
              width: "100%",
            }}
            ref={mapRef}
            whenReady={() => {
              setIsReady(true)
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </MapContainer>

          {/* Robot List */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "8px",
              maxHeight: "200px",
              overflowY: "auto",
              minWidth: "200px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginTop: "4px",
                fontSize: "12px",
              }}
            >
              Robots
            </div>
            {activeRobotGpsCoordinates.length === 0 ? (
              <div style={{fontSize: "11px", color: "#666"}}>No robots</div>
            ) : (
              activeRobotGpsCoordinates.map(({robotId, coordinate}) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                <div
                  key={robotId}
                  onClick={() => flyToRobot(robotId)}
                  style={{
                    cursor: "pointer",
                    padding: "2px 4px",
                    fontSize: "11px",
                    borderRadius: "2px",
                    marginBottom: "2px",
                    backgroundColor: "#f5f5f5",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e0e0e0"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f5f5"
                  }}
                >
                  {getRobotName(robotId)} ({coordinate.latitude?.toFixed(4)},{" "}
                  {coordinate.longitude?.toFixed(4)})
                </div>
              ))
            )}
          </div>
        </div>
      </WidgetFrame>
      {openSetting && (
        <OsmGpsMapSetting
          isOpen={openSetting}
          config={config}
          onUpdateConfig={onUpdateConfig}
          onClose={() => {
            setOpenSetting?.(false)
          }}
        />
      )}
    </>
  )
}
