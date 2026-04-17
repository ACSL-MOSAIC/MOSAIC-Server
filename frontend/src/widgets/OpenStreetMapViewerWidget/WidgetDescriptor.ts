import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class OpenStreetMapViewerWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "OpenStreetMapViewerWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "receivable";
  }

  public getMaxRobotConnectorNumber(): number {
    return -1;
  }

  public getDefaultInjectData(): string {
    return JSON.stringify({
      latitude: 36.3504,
      longitude: 127.3845,
    });
  }
}
