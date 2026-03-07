import type { RobotConnector } from "@/mosaic";
import type { MosaicStore } from "@/mosaic/store/interface/mosaic-store.ts";
import type { WebRTCConnection } from "@/mosaic/webrtc/webrtc-connection.ts";

export interface ChannelInfo {
  channelType: "datachannel" | "media";
  robotConnector: RobotConnector;
  rtcConnection: WebRTCConnection;
  rtcDataChannel: RTCDataChannel | null;
  mediaStream: MediaStream | null;
}

export interface ChannelRequirement {
  robotConnector: RobotConnector;
  store: MosaicStore;
}
