import {ReadOnlyStore} from "./read-only-store"
import {
  type ParsedRos2DPose,
  parseRos2DPose,
} from "@/dashboard/parser/ros-2d-pose.ts"

export class Ros2DPoseStore extends ReadOnlyStore<ParsedRos2DPose> {
  constructor(robotId: string, maxSize = 1000) {
    super(robotId, maxSize, parseRos2DPose)
  }
}
