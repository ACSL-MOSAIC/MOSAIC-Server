import type {ParsedData} from "./parsed.type"

export const GPS_COORDINATE_TYPE = Symbol("osm_gps_map")

export type ParsedGPSCoordinate = ParsedData<GPSCoordinate>

export interface GPSCoordinate {
  latitude: number
  longitude: number
  timestamp: Date
}

export const parseGPSCoordinate = (
  data: string,
): ParsedGPSCoordinate | null => {
  try {
    const json = JSON.parse(data)

    // 필수 필드 검증
    if (
      typeof json.latitude !== "number" ||
      typeof json.longitude !== "number"
    ) {
      console.warn("Invalid GPS Coordinate data format:", json)
      return null
    }

    return {
      latitude: json.latitude,
      longitude: json.longitude,
      timestamp: json.timestamp,
    }
  } catch (error) {
    console.error("Error parsing GPS Coordinate data:", error)
    return null
  }
}
