import type {WebSocketContextType} from "@/contexts/WebSocketContext"
import {DynamicTypeManager} from "@/dashboard/dynamic/dynamic-type-config"
import {VideoStoreManager} from "@/dashboard/store/media-channel-store/video-store-manager"
import type {ChannelType} from "./config/webrtc-datachannel-config"
import {MediaChannelConfigUtils} from "./config/webrtc-media-channel-config"
import {MEDIA_CHANNEL_CONFIG} from "./config/webrtc-media-channel-config"
import {createOfferWithMediaChannels} from "./webrtc-sdp-utils"
import {cleanupAllDataChannels, createDataChannel} from "./webrtc-utils"
import {sendWebSocketMessage, setupWebSocketHandlers} from "./ws-adaptor"

export interface DataChannelConfig {
  label: string
  dataType: string // 'turtlesim_position', 'go2_low_state', 'go2_ouster_pointcloud', etc.
  channelType: ChannelType // Channel type specification
  options?: RTCDataChannelInit
}

export interface VideoChannelConfig {
  label: string
  dataType: string // 'turtlesim_video', etc.
  expectedTrackLabel?: string // Expected video track label
}

export interface WebRTCConnectionConfig {
  robotId: string
  ws: WebSocketContextType
  onConnectionStateChange?: (isConnected: boolean) => void
  dataChannels?: DataChannelConfig[] // Channel-specific configuration
  videoChannels?: VideoChannelConfig[] // Video channel configuration
}

export interface MediaChannelConfig {
  label: string
  dataType: string
  expectedTrackLabel: string
}

export class WebRTCConnection {
  private peerConnection: RTCPeerConnection | null = null
  private config: WebRTCConnectionConfig
  private unsubscribeFunctions: (() => void)[] = []
  private pendingCandidates: RTCIceCandidate[] = []
  private dataChannels: Map<string, RTCDataChannel> = new Map()
  private channelDataTypes: Map<
    string,
    { dataType: string; channelType: ChannelType }
  > = new Map() // Channel label -> data type and channel type mapping
  private videoChannels: Map<string, VideoChannelConfig> = new Map() // Video channel configuration
  private videoChannelDataTypes: Map<string, string> = new Map() // Video channel label -> data type mapping

  constructor(config: WebRTCConnectionConfig) {
    this.config = config
    this.setupWebSocketHandlers()
  }

  public async startConnection(): Promise<void> {
    try {
      // Clean up existing connection if any
      if (this.peerConnection) {
        this.disconnect()
      }

      // Initialize VideoStoreManager
      const videoStoreManager = VideoStoreManager.getInstance()
      videoStoreManager.initializeRobotVideoStores(this.config.robotId)

      this.peerConnection = this.createPeerConnection()

      // Setup event handlers
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendWebSocketMessage(this.config.ws, {
            type: "send_ice_candidate",
            robot_id: this.config.robotId,
            ice_candidate: event.candidate,
          })
        }
      }

      this.peerConnection.oniceconnectionstatechange = () => {
        const isConnected =
          this.peerConnection?.iceConnectionState === "connected"
        // console.log(
        //   "Connection state:",
        //   isConnected ? "connected" : "disconnected",
        // )
        this.config.onConnectionStateChange?.(isConnected)
      }

      this.peerConnection.onsignalingstatechange = () => {
        // console.log(
        //   "Signaling state changed:",
        //   this.peerConnection?.signalingState,
        // )
      }

      this.peerConnection.onconnectionstatechange = () => {
        // console.log(
        //   "Connection state changed:",
        //   this.peerConnection?.connectionState,
        // )
      }

      this.peerConnection.ondatachannel = (event) => {
        console.log(
          "DataChannel received:",
          event.channel.label,
          event.channel.readyState,
        )
      }

      // Get active media channel list
      const activeMediaChannels =
        MediaChannelConfigUtils.getActiveMediaChannels()

      // Create Offer with media channel configuration applied
      const offer = await createOfferWithMediaChannels(
        this.peerConnection,
        activeMediaChannels,
      )

      await this.peerConnection.setLocalDescription(offer)

      // Send SDP offer to server
      sendWebSocketMessage(this.config.ws, {
        type: "send_sdp_offer",
        robot_id: this.config.robotId,
        sdp_offer: offer.sdp || "",
      })
    } catch (error) {
      console.error("Connection start error:", error)
      throw error
    }
  }

  public async setRemoteDescription(
    description: RTCSessionDescription,
  ): Promise<void> {
    if (!this.peerConnection) {
      console.error("PeerConnection not initialized")
      throw new Error("PeerConnection not initialized")
    }

    try {
      await this.peerConnection.setRemoteDescription(description)
    } catch (error) {
      console.error("Remote description setting failed:", error)
      throw error
    }
  }

  public async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      console.error("PeerConnection not initialized")
      throw new Error("PeerConnection not initialized")
    }

    try {
      await this.peerConnection.addIceCandidate(candidate)
    } catch (error) {
      console.error("ICE candidate addition failed:", error)
      throw error
    }
  }

  public disconnect(): void {
    // Unsubscribe WebSocket event listeners
    this.unsubscribeFunctions.forEach((unsubscribe) => unsubscribe())
    this.unsubscribeFunctions = []

    // Clean up DataChannels
    cleanupAllDataChannels(this.config.robotId)
    this.dataChannels.clear()
    this.channelDataTypes.clear()

    // Clean up VideoStores
    const videoStoreManager = VideoStoreManager.getInstance()
    videoStoreManager.cleanupRobotVideoStores(this.config.robotId)

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    this.pendingCandidates = []
    this.config.onConnectionStateChange?.(false)

    // Send Close Peer Connection msg to robot
    sendWebSocketMessage(this.config.ws, {
      type: "send_close_peer_connection",
      robot_id: this.config.robotId,
    })
  }

  public getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection
  }

  public getDataChannel(label: string): RTCDataChannel | undefined {
    return this.dataChannels.get(label)
  }

  // Return all data channel list
  public getDataChannels(): Map<string, RTCDataChannel> {
    return this.dataChannels
  }

  // Return data type by channel
  public getChannelDataType(channelLabel: string): string | undefined {
    return this.channelDataTypes.get(channelLabel)?.dataType
  }

  // Return channels that handle specific data type
  public getChannelsByDataType(dataType: string): string[] {
    const channels: string[] = []
    this.channelDataTypes.forEach((type, label) => {
      if (type.dataType === dataType) {
        channels.push(label)
      }
    })
    return channels
  }

  // Get video store manager
  public getVideoStoreManager(): VideoStoreManager {
    return VideoStoreManager.getInstance()
  }

  private setupWebSocketHandlers() {
    const {unsubscribe} = setupWebSocketHandlers(
      this.config.ws,
      this.config.robotId,
      {
        onSdpAnswer: async (sdpAnswer) => {
          try {
            // Setup ontrack handler (metadata-based)
            this.setupVideoTrackHandler()

            await this.setRemoteDescription(
              new RTCSessionDescription({
                type: "answer",
                sdp: sdpAnswer,
              }),
            )

            // Apply pending ICE candidates after SDP answer is set
            if (this.pendingCandidates.length > 0) {
              for (const candidate of this.pendingCandidates) {
                try {
                  await this.addIceCandidate(candidate)
                } catch (error) {
                  console.error(
                    "Pending ICE candidate application failed:",
                    error,
                  )
                }
              }
              this.pendingCandidates = []
            }
          } catch (error) {
            console.error("SDP Answer processing error:", error)
          }
        },
        onIceCandidate: async (candidate) => {
          try {
            // Queue if remote description is not set
            if (!this.peerConnection?.remoteDescription) {
              this.pendingCandidates.push(candidate)
              return
            }

            await this.addIceCandidate(candidate)
          } catch (error) {
            console.error("ICE Candidate processing error:", error)
          }
        },
      },
    )

    this.unsubscribeFunctions.push(unsubscribe)
  }

  private createPeerConnection(): RTCPeerConnection {
    // TODO: 서버로부터 ice servers 정보를 받아야 합니다.
    const configuration = {
      iceServers: [],
    }
    const peerConnection = new RTCPeerConnection(configuration)

    // Setup DataChannel event handlers
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel

      // Find data type for received channel
      const channelInfo = this.channelDataTypes.get(dataChannel.label)
      const dataType = channelInfo?.dataType
      const channelType = channelInfo?.channelType

      if (!dataType) {
        console.error(`Unregistered channel received: ${dataChannel.label}`)
        return
      }

      this.setupDataChannel(dataChannel, dataType, channelType || "readonly")
    }

    // Create configured data channels
    const channelsToCreate = this.config.dataChannels || []

    // Create multiple data channels
    channelsToCreate.forEach((channelConfig) => {
      const dataChannel = peerConnection.createDataChannel(
        channelConfig.label,
        {
          ordered: true,
          ...channelConfig.options,
        },
      )

      // Store channel and data type, channel type mapping
      this.channelDataTypes.set(channelConfig.label, {
        dataType: channelConfig.dataType,
        channelType: channelConfig.channelType,
      })

      // Setup created channel
      this.setupDataChannel(
        dataChannel,
        channelConfig.dataType,
        channelConfig.channelType,
      )
    })

    // Create dynamic data channels
    try {
      const dynamicTypeManager = DynamicTypeManager.getInstance()
      const dynamicChannels =
        dynamicTypeManager.createAllDynamicChannelsForRobot(
          this.config.robotId,
          peerConnection,
        )

      dynamicChannels.forEach((dataChannel: RTCDataChannel) => {
        // 동적 타입의 실제 이름 찾기
        const dynamicTypeManager = DynamicTypeManager.getInstance()
        const configs = dynamicTypeManager.getConfigsByRobotId(
          this.config.robotId,
        )
        const config = configs.find((c) => c.channelLabel === dataChannel.label)

        if (config) {
          // Store channel and data type, channel type mapping
          this.channelDataTypes.set(dataChannel.label, {
            dataType: config.name, // 실제 동적 타입 이름 사용
            channelType: config.channelType,
          })

          // Setup created channel
          this.setupDataChannel(dataChannel, config.name, config.channelType)
        } else {
          console.warn(`동적 타입 설정을 찾을 수 없음: ${dataChannel.label}`)
        }
      })
    } catch (error) {
      console.error("Failed to create dynamic channels:", error)
    }

    // Setup video channels (after data channel setup)
    this.setupVideoChannels()

    return peerConnection
  }

  private setupVideoChannels() {
    // Get video channel configuration from MediaChannelConfig
    const mediaChannels = this.createMediaChannels()

    // Store configured video channels
    const channelsToSetup = this.config.videoChannels || []

    // Add default video channels from MediaChannelConfig (if not in configuration)
    const defaultVideoChannels: VideoChannelConfig[] = mediaChannels.map(
      (channel) => ({
        label: channel.label,
        dataType: channel.dataType,
        expectedTrackLabel: channel.expectedTrackLabel,
      }),
    )

    const allVideoChannels = [
      ...channelsToSetup,
      ...defaultVideoChannels.filter(
        (ch) =>
          !channelsToSetup.some((configured) => configured.label === ch.label),
      ),
    ]

    allVideoChannels.forEach((channelConfig) => {
      this.videoChannels.set(channelConfig.label, channelConfig)
      this.videoChannelDataTypes.set(
        channelConfig.label,
        channelConfig.dataType,
      )
    })
  }

  private setupDataChannel(
    dataChannel: RTCDataChannel,
    dataType: string,
    channelType: "readonly" | "writeonly",
  ) {
    // DataChannel state change event handlers
    // dataChannel.onopen = () => {
    //   console.log(
    //     `DataChannel ${dataChannel.label} opened, state:`,
    //     dataChannel.readyState,
    //   )
    // }

    dataChannel.onclose = () => {
      // console.log(
      //   `DataChannel ${dataChannel.label} closed, state:`,
      //   dataChannel.readyState,
      // )
      this.dataChannels.delete(dataChannel.label)
      this.channelDataTypes.delete(dataChannel.label)
    }

    dataChannel.onerror = (error) => {
      console.error(`DataChannel ${dataChannel.label} error:`, error)
    }

    createDataChannel(dataChannel, this.config.robotId, dataType, channelType)

    // Store DataChannel
    this.dataChannels.set(dataChannel.label, dataChannel)
  }

  // Setup Video Track handler based on metadata
  private setupVideoTrackHandler(): void {
    if (!this.peerConnection) {
      console.error("PeerConnection not initialized")
      return
    }

    this.peerConnection.ontrack = (event) => {
      if (event.track.kind !== "video") {
        return
      }

      if (!event.streams?.[0]) {
        console.warn("Video track has no stream")
        return
      }

      const stream = event.streams[0]

      // Use media type extracted from MSID
      const mediaType = stream.id

      if (!mediaType) {
        console.warn("Media type not found in metadata")
        return
      }

      // Check if media type is supported
      if (!MediaChannelConfigUtils.isSupportedMediaType(mediaType)) {
        console.warn(`Unsupported media type: ${mediaType}`)
      }

      // Create and connect VideoStore
      const videoStoreManager = VideoStoreManager.getInstance()
      const videoStore = videoStoreManager.createVideoStoreByMediaTypeAuto(
        this.config.robotId,
        mediaType,
      )

      if (!videoStore) {
        console.warn(`Failed to create VideoStore for media type: ${mediaType}`)
        return
      }

      // Set simplified metadata (MSID-based)
      videoStore.setMetadata({
        mediaType,
        source: "robot_stream",
      })

      videoStore.setPeerConnection(this.peerConnection)
      videoStore.setMediaStreamTrack(event.track)

      videoStore.setMediaStream(stream)
      // console.log(
      //   `Video Store connected: ${mediaType} for robot ${this.config.robotId}`,
      // )
    }
  }

  private createMediaChannels(): MediaChannelConfig[] {
    // Dynamically create from MEDIA_CHANNEL_CONFIG
    return Object.entries(MEDIA_CHANNEL_CONFIG).map(([mediaType, config]) => ({
      label: config.defaultLabel,
      dataType: mediaType,
      expectedTrackLabel: config.defaultLabel,
    }))
  }
}
