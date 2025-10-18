import type {ParsedData} from "./parsed.type"

export const ROS_2D_POSE_TYPE = Symbol("ros_2d_pose")

export type ParsedRos2DPose = ParsedData<Ros2DPose>

export interface Ros2DPose {
  latitude: number
  longitude: number
  timestamp: Date
}

export const parseRos2DPose = (data: string): ParsedRos2DPose | null => {
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
