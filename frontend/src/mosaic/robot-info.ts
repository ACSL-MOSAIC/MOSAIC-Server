import type {RobotConfig, RobotStatus} from "@/mosaic/index.ts"

export class RobotInfo {
  private readonly _id: string
  private readonly _name: string
  private readonly _wsConnected: boolean
  private readonly _status: RobotStatus

  public constructor(
    id: string,
    name: string,
    wsConnected: boolean,
    rtcStates: RobotStatus,
    robotConfigs: RobotConfig | null,
  ) {
    this._id = id
    this._name = name
    this._wsConnected = wsConnected
    this._status = rtcStates
    this._robotConfigs = robotConfigs
  }

  private _robotConfigs: RobotConfig | null

  get robotConfigs(): RobotConfig | null {
    return this._robotConfigs
  }

  set robotConfigs(robotConfigs: RobotConfig) {
    this._robotConfigs = robotConfigs
  }

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get wsConnected(): boolean {
    return this._wsConnected
  }

  get status(): RobotStatus {
    return this._status
  }
}
