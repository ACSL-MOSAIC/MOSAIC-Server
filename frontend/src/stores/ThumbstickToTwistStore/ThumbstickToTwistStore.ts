import type { Thumbstick } from "@/stores/@types/thumbstick.ts";

import { SendableStore } from "@/mosaic/store/interface/sendable-store.ts";

export class ThumbstickToTwistStore extends SendableStore<Thumbstick> {
  public send(data: Thumbstick): void {
    const { angle, power, holonomic } = data;
    const forward = power * Math.cos(angle);
    const lateral = -power * Math.sin(angle);

    const twistData = holonomic
      ? {
          linear: { x: forward, y: lateral, z: 0 },
          angular: { x: 0, y: 0, z: 0 },
        }
      : {
          linear: { x: forward, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: lateral },
        };

    this.sendData(JSON.stringify(twistData));
  }
}
