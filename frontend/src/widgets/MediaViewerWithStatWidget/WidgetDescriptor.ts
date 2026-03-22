import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class MediaViewerWithStatWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "MediaViewerWithStatWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "media";
  }

  // TODO: 미디어 스트림 위젯은 JSON inject 방식으로 테스트 불가
}
