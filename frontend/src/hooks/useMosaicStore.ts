import { useCallback, useContext } from "react";

import type { RobotConnector } from "@/mosaic";

import { MosaicContext } from "@/contexts/MosaicContext.ts";

export function useMosaicStore() {
  const context = useContext(MosaicContext);
  if (!context) {
    throw new Error("useMosaicStore must be used within a MosaicProvider");
  }

  const { storeManager, channelManager, robotInfos } = context;

  const getOrCreateStore = useCallback(
    (robotConnector: RobotConnector) => {
      const robotInfo = robotInfos.find((info) => info.id === robotConnector.robotId);
      if (!robotInfo) {
        console.error(`Robot not found: ${robotConnector.robotId}`);
        return null;
      }

      const store = storeManager.getOrCreateStore(robotConnector, robotInfo.robotConfigs);
      if (!store) return null;
      store.getChannelRequirements(robotConnector).forEach((cr) => {
        channelManager.addChannelRequirement(cr);
      });
      return store;
    },
    [channelManager, robotInfos, storeManager],
  );

  const releaseStore = useCallback(
    (robotConnector: RobotConnector) => {
      const isReleased = storeManager.releaseStore(robotConnector);
      if (isReleased) {
        channelManager.removeChannelRequirementByConnector(robotConnector);
      }
    },
    [channelManager, storeManager],
  );

  return {
    getOrCreateStore,
    releaseStore,
  };
}
