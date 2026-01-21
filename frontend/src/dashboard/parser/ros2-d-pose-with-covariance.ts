import type {ParsedData} from "./parsed.type"

export const ROS_2D_POSE_TYPE = Symbol("ros_2d_pose")

export type ParsedRos2DPose = ParsedData<Ros2DPoseWithCovariance>

export interface RosPose {
  position: RosPoint
  orientation: RosQuaternion
}

export interface RosPoint {
  x: number
  y: number
  z: number
}

export interface RosQuaternion {
  x: number
  y: number
  z: number
  w: number
}

export interface Ros2DPoseWithCovariance {
  pose: RosPose
  covariance: number[]
  timestamp: Date
}

export const parseRos2DPose = (data: string): ParsedRos2DPose | null => {
  try {
    const json = JSON.parse(data)
    console.log(json)

    if (!json.pose || !json.pose.position || !json.pose.orientation) {
      console.warn("Invalid ROS 2D Pose data format:", json)
      return null
    }

    return {
      pose: {
        position: {
          x: json.pose.position.x,
          y: json.pose.position.y,
          z: json.pose.position.z,
        },
        orientation: {
          x: json.pose.orientation.x,
          y: json.pose.orientation.y,
          z: json.pose.orientation.z,
          w: json.pose.orientation.w,
        },
      },
      covariance: [],
      timestamp: json.timestamp,
    }
  } catch (error) {
    console.error("Error parsing GPS Coordinate data:", error)
    return null
  }
}
