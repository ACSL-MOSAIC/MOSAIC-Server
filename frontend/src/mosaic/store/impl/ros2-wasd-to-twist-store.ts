import type { SimpleDirection } from "@/mosaic/store/type/simple-direction.ts";

import { SendableStore } from "@/mosaic/store/interface/sendable-store.ts";

export class Ros2WasdToTwistStore extends SendableStore<SimpleDirection> {
  static readonly connectorType = "ros2-wasd-to-twist";
  connectorType = Ros2WasdToTwistStore.connectorType;

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
