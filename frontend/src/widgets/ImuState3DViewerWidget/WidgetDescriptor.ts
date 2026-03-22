import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class ImuState3DViewerWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "ImuState3DViewerWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "receivable";
  }

  public getDefaultInjectData(): string {
    return JSON.stringify({
      angular_velocity: [0.01, -0.02, 0.05],
      linear_acceleration: [0.12, -0.05, 9.81],
      orientation: [1.0, 0.0, 0.0, 0.0],
    });
  }
}
