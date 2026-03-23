import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";
import { ColorMode } from "@/widgets/PointCloud3DViewerWidget/colorMapping.ts";

export type PointCloud3DViewerParams = {
  colorMode: ColorMode;
  pointSize: number;
  showAxes: boolean;
  autoRotate: boolean;
};

export default class PointCloud3DViewerWidgetDescriptor extends WidgetDescriptor<PointCloud3DViewerParams> {
  public getName(): string {
    return "PointCloud3DViewerWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "receivable";
  }

  public supportCustomParams(): boolean {
    return true;
  }

  public getDefaultParams(): PointCloud3DViewerParams {
    return {
      colorMode: "height",
      pointSize: 0.05,
      showAxes: false,
      autoRotate: false,
    };
  }

  // TODO: PointCloudData는 binary chunk 구조를 포함하므로 JSON inject 불가
}
