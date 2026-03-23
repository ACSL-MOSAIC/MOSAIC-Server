import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class MediaViewerWithStatWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "MediaViewerWithStatWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "media";
  }
}
