import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export type JsonViewerParams = {
  cumulative: boolean;
};

export default class JsonViewerWidgetDescriptor extends WidgetDescriptor<JsonViewerParams> {
  public getName(): string {
    return "JsonViewerWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "receivable";
  }

  public supportCustomParams(): boolean {
    return true;
  }

  public getDefaultParams(): JsonViewerParams {
    return {
      cumulative: false,
    };
  }

  public getDefaultInjectData(): string {
    return JSON.stringify({
      message: "Hello, World!",
    });
  }
}
