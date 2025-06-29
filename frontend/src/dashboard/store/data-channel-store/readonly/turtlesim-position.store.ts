import { ReadOnlyStore } from "./read-only-store"
import { ParsedTurtlesimPosition, parseTurtlesimPosition } from "../../../parser/turtlesim-position"

export class TurtlesimPositionStore extends ReadOnlyStore<ParsedTurtlesimPosition> {
    constructor(robotId: string, maxSize: number = 1000) {
        super(robotId, maxSize, parseTurtlesimPosition)
    }
} 