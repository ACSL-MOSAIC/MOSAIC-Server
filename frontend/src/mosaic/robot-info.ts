import type { RobotConfig, RobotStatus } from "@/mosaic/index.ts"
import { convertRobotStatusToString } from "@/utils/robot-status.ts"

export class RobotInfo {
  private readonly _id: string
  private readonly _name: string
  private readonly _status: RobotStatus
  private readonly _robotConfigs: RobotConfig

  public constructor(
    id: string,
    name: string,
    status: RobotStatus,
    robotConfigs: RobotConfig,
  ) {
    this._id = id
    this._name = name
    this._status = status
    this._robotConfigs = robotConfigs
  }

  get robotConfigs(): RobotConfig {
    return this._robotConfigs
  }

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get status(): RobotStatus {
    return this._status
  }

  get statusString(): string {
    return convertRobotStatusToString(this._status)
  }

  get isConnected(): boolean {
    return this._status !== 5
  }

  get isReadyToConnect(): boolean {
    return this._status === 0
  }

  get isRtcConnected(): boolean {
    return this._status === 2
  }

  get needSync(): boolean {
    return (
      this._status !== 0 &&
      this._status !== 2 &&
      this._status !== 4 &&
      this._status !== 5
    )
  }
}
