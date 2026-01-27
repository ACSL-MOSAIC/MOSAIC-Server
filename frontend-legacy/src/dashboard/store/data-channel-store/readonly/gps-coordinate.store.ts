import {ReadOnlyStore} from "./read-only-store"
import {
  type ParsedGPSCoordinate,
  parseGPSCoordinate,
} from "@/dashboard/parser/gps-coordinate.ts"

export class GPSCoordinateStore extends ReadOnlyStore<ParsedGPSCoordinate> {
  constructor(robotId: string, maxSize = 1000) {
    super(robotId, maxSize, parseGPSCoordinate)
  }
}
