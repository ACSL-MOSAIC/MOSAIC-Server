import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export const DEEPLAB_BASE_OPTIONS = ["pascal", "cityscapes", "ade20k"] as const;
export type DeeplabBase = (typeof DEEPLAB_BASE_OPTIONS)[number];

export type SegmentationMediaParams = {
  tfModel: "deeplab";
  deeplabBase: DeeplabBase;
  segmentationHz: number;
  flipH: boolean;
  flipV: boolean;
};

const MIN_SEGMENTATION_HZ = 1;
const MAX_SEGMENTATION_HZ = 60;

export default class SegmentationMediaWidgetDescriptor extends WidgetDescriptor<SegmentationMediaParams> {
  public getName(): string {
    return "SegmentationMediaWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "media";
  }

  public supportCustomParams(): boolean {
    return true;
  }

  public getDefaultParams(): SegmentationMediaParams {
    return {
      tfModel: "deeplab",
      deeplabBase: "pascal",
      segmentationHz: 10,
      flipH: false,
      flipV: false,
    };
  }

  public validateParams(params: SegmentationMediaParams): string | null {
    const model = params?.tfModel;
    if (model !== undefined && model !== "deeplab") {
      return "SegmentationMediaWidget supports only deeplab.";
    }

    if (!params || !DEEPLAB_BASE_OPTIONS.includes(params.deeplabBase)) {
      return "deeplabBase must be one of pascal, cityscapes, ade20k.";
    }

    if (
      typeof params?.segmentationHz !== "number" ||
      !Number.isFinite(params.segmentationHz) ||
      params.segmentationHz < MIN_SEGMENTATION_HZ ||
      params.segmentationHz > MAX_SEGMENTATION_HZ
    ) {
      return "segmentationHz must be a number between 1 and 60.";
    }

    if (typeof params?.flipH !== "boolean" || typeof params?.flipV !== "boolean") {
      return "flipH and flipV must be boolean.";
    }

    return null;
  }
}
