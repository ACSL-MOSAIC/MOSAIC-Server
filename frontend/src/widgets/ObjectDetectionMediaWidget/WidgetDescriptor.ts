import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class ObjectDetectionMediaWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "ObjectDetectionMediaWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "media";
  }

  public validateParams(params: Record<string, any>): string | null {
    const model = params?.tfModel;
    if (model !== undefined && model !== "coco-ssd") {
      return "ObjectDetectionMediaWidget supports only coco-ssd.";
    }
    return null;
  }
}
