import type { SimpleDirection } from "@/stores/@types/simple-direction.ts";

import { SendableStore } from "@/mosaic/store/interface/sendable-store.ts";

export class Ros2WasdToTwistStore extends SendableStore<SimpleDirection> {
  public send(data: SimpleDirection): void {
    const twistData = {
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 },
    };
    if (data === "up") {
      twistData.linear = { x: 1, y: 0, z: 0 };
    } else if (data === "down") {
      twistData.linear = { x: -1, y: 0, z: 0 };
    } else if (data === "left") {
      twistData.angular = { x: 0, y: 0, z: 1 };
    } else if (data === "right") {
      twistData.angular = { x: 0, y: 0, z: -1 };
    }
    this.sendData(JSON.stringify(twistData));
  }
}
