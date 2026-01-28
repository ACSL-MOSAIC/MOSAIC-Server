import {useContext} from "react"
import {MosaicContext} from "@/contexts/MosaicContext.tsx"
import type {ChannelRequirement} from "@/mosaic/channel"

export function useMosaicChannel() {
  const context = useContext(MosaicContext)
  if (!context) {
    throw new Error("useMosaicChannel must be used within a MosaicProvider")
  }

  const {channelManager} = context
  const addChannelRequirement = (channelRequirement: ChannelRequirement) => {
    channelManager.addChannelRequirement(channelRequirement)
  }
  return {
    addChannelRequirement,
  }
}
