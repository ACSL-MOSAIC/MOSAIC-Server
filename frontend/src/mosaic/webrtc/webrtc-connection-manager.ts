import type {RobotConnector} from "@/mosaic"
import type {ChannelRequirement} from "@/mosaic/channel"
import type {SignalingServer} from "@/mosaic/webrtc/signaling-server.ts"
import {WebRTCConnection} from "@/mosaic/webrtc/webrtc-connection.ts"

export class WebRTCConnectionManager {
  private readonly signalingServer: SignalingServer
  private connections: Map<string, WebRTCConnection>

  constructor(signalingServer: SignalingServer) {
    this.signalingServer = signalingServer
  }

  public async createConnection(
    robotId: string,
    channelRequirements: ChannelRequirement[],
  ): Promise<void> {
    const rtcConnectionId = await this.prepareRtcConnection(robotId)
    const webrtcConnection = new WebRTCConnection(rtcConnectionId, robotId)
    this.connections.set(robotId, webrtcConnection)
    webrtcConnection.createConnection(channelRequirements)
    await webrtcConnection.startConnection()
  }

  public disconnectConnection(robotId: string): void {
    // TODO
  }

  public getConnection(robotId: string): WebRTCConnection | undefined {
    // TODO
  }

  public removeDataChannel(robotConnector: RobotConnector): void {
    // TODO
  }

  private async prepareRtcConnection(robotId: string): Promise<string> {
    // TODO
  }
}
