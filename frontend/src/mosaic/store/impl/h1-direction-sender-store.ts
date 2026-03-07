import type { SimpleDirection } from "@/mosaic/store/type/simple-direction.ts";

import { SendableStore } from "@/mosaic/store/interface/sendable-store.ts";

export class H1DirectionSenderStore extends SendableStore<SimpleDirection> {
  static readonly connectorType = "h1_direction_sender";
  connectorType = H1DirectionSenderStore.connectorType;

  public send(data: SimpleDirection): void {
    const directionData = {
      lin_vel_x: 0,
      ang_vel_yaw: 0,
    };

    if (data === "up") {
      directionData.lin_vel_x = 1;
    } else if (data === "down") {
      directionData.lin_vel_x = -1;
    } else if (data === "left") {
      directionData.lin_vel_x = 1;
      directionData.ang_vel_yaw = -1;
    } else if (data === "right") {
      directionData.lin_vel_x = 1;
      directionData.ang_vel_yaw = 1;
    }
    this.sendData(JSON.stringify(directionData));
  }
}
