import { DataStore } from "./store"
import { ParsedGo2LowState, parseGo2LowState } from "../parser/go2-low-state"

export class Go2LowStateStore extends DataStore<ParsedGo2LowState> {
    constructor(robotId: string, maxSize: number = 1000) {
        super(robotId, maxSize, parseGo2LowState)
    }
}