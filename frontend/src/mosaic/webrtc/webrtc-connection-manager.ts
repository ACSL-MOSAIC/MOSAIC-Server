import {
  createWebRTCConnectionApi,
  getIceServersApi,
} from "@/client/service/webrtc.api.ts"
import type { RobotConnector } from "@/mosaic"
import type { ChannelRequirement } from "@/mosaic/channel"
import type { SignalingServer } from "@/mosaic/webrtc/signaling-server.ts"
import { WebRTCConnection } from "@/mosaic/webrtc/webrtc-connection.ts"

export class WebRTCConnectionManager {
  private readonly signalingServer: SignalingServer
  private connections: Map<string, WebRTCConnection>
  private robotIdToRtcConnectionId: Map<string, string> = new Map()
  private iceServers: RTCIceServer[] = []

  constructor(signalingServer: SignalingServer) {
    this.signalingServer = signalingServer
    this.connections = new Map()
  }

  // robotIds 한 번의 API 호출로 각각의 rtcConnectionId 발급 후 내부 Map에 저장, return value는 참고용
  public async prepareRtcConnection(robotIds: string[]): Promise<Map<string, string>> {
    if (robotIds.length === 0) {
      return new Map()
    }
    const response = await createWebRTCConnectionApi({ robotIds })
    const map = new Map<string, string>()
    for (const session of response.sessions) {
      map.set(session.robotId, session.rtcSessionId)
      this.robotIdToRtcConnectionId.set(session.robotId, session.rtcSessionId)
    }
    return map
  }

  // 저장된 Map에서 robotId의 rtcConnectionId를 조회 후 연결
  public async createConnection(
    robotId: string,
    channelRequirements: ChannelRequirement[],
  ): Promise<void> {
    const rtcConnectionId = this.robotIdToRtcConnectionId.get(robotId)
    if (!rtcConnectionId) {
      throw new Error(
        `No rtcConnectionId for robot ${robotId}. Call prepareRtcConnection([robotId]) first.`,
      )
    }

    if (this.iceServers.length === 0) {
      const response = await getIceServersApi()
      this.iceServers = response.map((iceServer) => {
        const rtcIceServer: RTCIceServer = {
          urls: iceServer.urls,
          username: iceServer.username ?? undefined,
          credential: iceServer.credential ?? undefined,
        }
        return rtcIceServer
      })
    }

    const existingConnection = this.connections.get(robotId)
    if (existingConnection) {
      this.disconnectConnection(robotId)
    }

    const webrtcConnection = new WebRTCConnection(rtcConnectionId, robotId)
    webrtcConnection.setIceServers(this.iceServers)
    this.signalingServer.setRtcConnection(webrtcConnection)
    this.connections.set(robotId, webrtcConnection)
    webrtcConnection.createConnection(channelRequirements)
    await webrtcConnection.startConnection()
  }

  public disconnectConnection(robotId: string): void {
    const connection = this.connections.get(robotId)
    // connection이 존재하지 않을 경우 prepareRtcConnection으로 발급받은 Map에서 조회
    const rtcConnectionId = connection?.rtcConnectionId ?? this.robotIdToRtcConnectionId.get(robotId)
    if (!rtcConnectionId) {
      return
    }

    // backend/robot에게 rtc session 종료 알림
    this.signalingServer.sendCloseConnection(rtcConnectionId)

    if (connection) {
      connection.disconnect()
      this.signalingServer.removeRtcConnection(rtcConnectionId)
      this.connections.delete(robotId)
    }

    this.robotIdToRtcConnectionId.delete(robotId)
  }

  public getConnection(robotId: string): WebRTCConnection | undefined {
    return this.connections.get(robotId)
  }

  public removeDataChannel(robotConnector: RobotConnector): void {
    //TODO: 하위 클래스 구현 후 다시 수정 예정
  }
}
