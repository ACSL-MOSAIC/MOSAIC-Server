import { createContext } from "react";

import type { ChannelManager } from "@/mosaic/channel/channel-manager.ts";
import type { RobotInfo } from "@/mosaic/robot-info.ts";
import type { StoreManager } from "@/mosaic/store/store-manager.ts";
import type { WebRTCConnectionManager } from "@/mosaic/webrtc/webrtc-connection-manager.ts";

export interface MosaicContextType {
  storeManager: StoreManager;
  channelManager: ChannelManager;
  webrtcConnectionManager: WebRTCConnectionManager;
  robotInfos: RobotInfo[];
  updateRobotInfo: (robotInfo: RobotInfo) => void;
  subscribeRobots: (robotIds: string[]) => Promise<void>;
  unsubscribeRobots: () => void;
}

export const MosaicContext = createContext<MosaicContextType | null>(null);
