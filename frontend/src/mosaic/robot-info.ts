import type {RobotConfig, RTCConnectionState} from "@/mosaic/index.ts"

export class RobotInfo {
  private readonly _id: string
  private readonly _name: string
  private readonly _wsConnected: boolean
  private readonly _rtcStates: RTCConnectionState
  private readonly _robotConfigs: RobotConfig | null

  public constructor(
    id: string,
    name: string,
    wsConnected: boolean,
    rtcStates: RTCConnectionState,
    robotConfigs: RobotConfig | null,
  ) {
    this._id = id
    this._name = name
    this._wsConnected = wsConnected
    this._rtcStates = rtcStates
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

  get rtcStates(): RTCConnectionState {
    return this._rtcStates
  }

  get robotConfigs(): RobotConfig | null {
    return this._robotConfigs
  }
}
