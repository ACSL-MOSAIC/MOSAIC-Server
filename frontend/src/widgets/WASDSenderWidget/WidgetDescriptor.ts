import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class WASDSenderWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "WASDSenderWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "sendable";
  }
}