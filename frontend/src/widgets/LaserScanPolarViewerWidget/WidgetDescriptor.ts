import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class LaserScanPolarViewerWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "LaserScanPolarViewerWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "receivable";
  }

  public getDefaultInjectData(): string {
    // 12 points, 30° increments — close obstacles on one side, open on the other
    return JSON.stringify({
      angle_min: -3.14159,
      angle_max: 3.14159,
      angle_increment: 0.5236,
      range_min: 0.1,
      range_max: 10.0,
      ranges: [3.0, 2.5, 1.8, 1.2, 1.8, 2.5, 3.0, 5.0, 7.0, 8.5, 9.0, 8.5],
      intensities: [],
      scan_time: 0.1,
      time_increment: 0.0001,
    });
  }
}
