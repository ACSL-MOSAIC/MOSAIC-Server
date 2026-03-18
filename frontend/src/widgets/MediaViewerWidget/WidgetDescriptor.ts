import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class MediaViewerWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "MediaViewerWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "media";
  }

  public supportCustomParams(): boolean {
    return true;
  }

  public validateParams(_params: Record<string, any>): string | null {
    return null;
  }
}