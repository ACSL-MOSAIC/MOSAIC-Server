import { DataStore } from "./store"
import { ParsedGo2Imu, parseGo2Imu } from "../parser/go2_imu"

export class Go2ImuStore extends DataStore<ParsedGo2Imu> {
    constructor(robotId: string, maxSize: number = 1000) {
        super(robotId, maxSize, parseGo2Imu)
    }
}