import { SendableStore } from "@/mosaic/store/interface/sendable-store.ts"
import type { Thumbstick } from "@/mosaic/store/type/thumbstick.ts"

export class ThumbstickToTwistStore extends SendableStore<Thumbstick> {
  static readonly connectorType = "thumbstick-to-twist"
  connectorType = ThumbstickToTwistStore.connectorType

  public send(data: Thumbstick): void {
    const { angle, power, holonomic } = data
    const forward = power * Math.cos(angle)
    const lateral = -power * Math.sin(angle)

    const twistData = holonomic
      ? {
          linear: { x: forward, y: lateral, z: 0 },
          angular: { x: 0, y: 0, z: 0 },
        }
      : {
          linear: { x: forward, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: lateral },
        }

    this.sendData(JSON.stringify(twistData))
  }
}
