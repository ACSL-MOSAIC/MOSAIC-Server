import type {RobotConfig, RTCConnectionState} from "@/mosaic/index.ts"

export class RobotInfo {
  private id: string
  private name: string
  private wsConnected: boolean
  private rtcStates: RTCConnectionState
  private robotConfigs: RobotConfig

  public getRobotConfigs(): RobotConfig | undefined
}
