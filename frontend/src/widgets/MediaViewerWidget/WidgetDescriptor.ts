import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export type MediaViewerParams = {
  flipH: boolean;
  flipV: boolean;
};

export default class MediaViewerWidgetDescriptor extends WidgetDescriptor<MediaViewerParams> {
  public getName(): string {
    return "MediaViewerWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "media";
  }

  public supportCustomParams(): boolean {
    return true;
  }

  public getDefaultParams(): MediaViewerParams {
    return {
      flipH: false,
      flipV: false,
    };
  }

  public validateParams(_params: MediaViewerParams): string | null {
    return null;
  }
}
