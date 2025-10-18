import {
  type ParsedTurtlesimPosition,
  parseTurtlesimPosition,
} from "../../../parser/turtlesim-position"
import {ReadOnlyStore} from "./read-only-store"

export class TurtlesimPositionStore extends ReadOnlyStore<ParsedTurtlesimPosition> {
  constructor(robotId: string, maxSize = 1000) {
    super(robotId, maxSize, parseTurtlesimPosition)
  }
}
