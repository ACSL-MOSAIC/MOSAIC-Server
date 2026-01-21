import {
  type ParsedGo2LowState,
  parseGo2LowState,
} from "../../../parser/go2-low-state"
import {ReadOnlyStore} from "./read-only-store"

export class Go2LowStateStore extends ReadOnlyStore<ParsedGo2LowState> {
  constructor(robotId: string, maxSize = 1000) {
    super(robotId, maxSize, parseGo2LowState)
  }
}
