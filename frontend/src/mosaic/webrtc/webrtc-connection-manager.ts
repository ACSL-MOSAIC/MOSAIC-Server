import type {RobotConnector} from "@/mosaic"
import {createWebRTCConnectionApi} from "@/client/service/webrtc.api.ts"
import type {ChannelRequirement} from "@/mosaic/channel"
import type {SignalingServer} from "@/mosaic/webrtc/signaling-server.ts"
import {WebRTCConnection} from "@/mosaic/webrtc/webrtc-connection.ts"

export class WebRTCConnectionManager {
  private readonly signalingServer: SignalingServer
  private connections: Map<string, WebRTCConnection>

  constructor(signalingServer: SignalingServer) {
    this.signalingServer = signalingServer
    this.connections = new Map()
  }

  public async createConnection(
    robotId: string,
    channelRequirements: ChannelRequirement[],
  ): Promise<void> {
    const existingConnection = this.connections.get(robotId)
    if (existingConnection) {
      this.disconnectConnection(robotId)
    }

    const rtcConnectionId = await this.prepareRtcConnection(robotId)
    const webrtcConnection = new WebRTCConnection(rtcConnectionId, robotId)
    this.signalingServer.setRtcConnection(webrtcConnection)
    this.connections.set(robotId, webrtcConnection)
    webrtcConnection.createConnection(channelRequirements)
    await webrtcConnection.startConnection()
  }

  public disconnectConnection(robotId: string): void {
    const connection = this.connections.get(robotId)
    if (!connection) {
      return
    } 
    connection.disconnect()
    this.connections.delete(robotId)
  }

  public getConnection(robotId: string): WebRTCConnection | undefined {
    return this.connections.get(robotId)
  }

  public removeDataChannel(robotConnector: RobotConnector): void {
    console.warn(
      `[${robotConnector.serialize()}] removeDataChannel is not implemented yet`,
    )
  }

  private async prepareRtcConnection(robotId: string): Promise<string> {
    const response = await createWebRTCConnectionApi({robotIds: [robotId]})
    const targetSession =
      response.sessions.find((session) => session.robotId === robotId) ??
      response.sessions[0]

    if (!targetSession) {
      throw new Error(
        `Failed to create WebRTC session for robot ${robotId}: no session returned`,
      )
    }

    return targetSession.rtcSessionId
  }
}
