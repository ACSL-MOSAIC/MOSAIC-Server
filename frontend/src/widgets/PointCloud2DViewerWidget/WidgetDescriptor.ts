import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class PointCloud2DViewerWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "PointCloud2DViewerWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "receivable";
  }

  // TODO: PointCloudData는 binary chunk 구조를 포함하므로 JSON inject 불가
}