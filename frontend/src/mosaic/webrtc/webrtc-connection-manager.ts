import type {RobotConnector} from "@/mosaic"
import type {WebRTCConnection} from "@/mosaic/webrtc/webrtc-connection.ts"
import type {ChannelRequirement} from "@/mosaic/channel"
import type {SignalingServer} from "@/mosaic/webrtc/signaling-server.ts"

export class WebRTCConnectionManager {
  private signalingServer: SignalingServer
  private connections: Map<string, WebRTCConnection>

  public async createConnection(
    robotId: string,
    channelRequirements: ChannelRequirement[],
  ): Promise<void> {
  }

  public disconnectConnection(robotId: string): void {
  }

  public getConnection(robotId: string): WebRTCConnection | undefined {
  }

  public removeDataChannel(robotConnector: RobotConnector): void {
  }
}
