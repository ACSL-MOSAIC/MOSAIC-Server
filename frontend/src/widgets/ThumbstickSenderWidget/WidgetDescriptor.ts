import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export type ThumbstickParams = {
  holonomic: boolean;
};

export default class ThumbstickSenderWidgetDescriptor extends WidgetDescriptor<ThumbstickParams> {
  public getName(): string {
    return "ThumbstickSenderWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "sendable";
  }

  public supportCustomParams(): boolean {
    return true;
  }

  public getDefaultParams(): ThumbstickParams {
    return {
      holonomic: false,
    };
  }
}
