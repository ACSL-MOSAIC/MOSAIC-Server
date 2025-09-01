import {
  type ParsedPointCloud2,
  parsePointCloud2,
} from "../../../parser/lidar-pointcloud.ts"
import { ReadOnlyStore } from "./read-only-store"

export class LidarPointCloudStore extends ReadOnlyStore<
  ParsedPointCloud2,
  ArrayBuffer
> {
  constructor(robotId: string) {
    super(robotId, 100, parsePointCloud2)
  }
}
