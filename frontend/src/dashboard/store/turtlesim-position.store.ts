import { DataStore } from "./store"
import { ParsedTurtlesimPosition, parseTurtlesimPosition } from "../parser/turtlesim-position"

export class TurtlesimPositionStore extends DataStore<ParsedTurtlesimPosition> {
    constructor(robotId: string, maxSize: number = 1000) {
        super(robotId, maxSize, parseTurtlesimPosition)
    }
} 