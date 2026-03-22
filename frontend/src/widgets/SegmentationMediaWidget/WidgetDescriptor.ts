import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class SegmentationMediaWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "SegmentationMediaWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "media";
  }

  public validateParams(params: Record<string, any>): string | null {
    const model = params?.tfModel;
    if (model !== undefined && model !== "deeplab") {
      return "SegmentationMediaWidget supports only deeplab.";
    }
    return null;
  }
}
