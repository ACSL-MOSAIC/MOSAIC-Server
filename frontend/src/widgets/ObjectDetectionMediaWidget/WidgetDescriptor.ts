import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export type ObjectDetectionMediaParams = {
  tfModel: "coco-ssd";
  detectionHz: number;
  scoreThreshold: number;
  flipH: boolean;
  flipV: boolean;
};

const MIN_DETECTION_HZ = 1;
const MAX_DETECTION_HZ = 60;
const MIN_SCORE_THRESHOLD = 0;
const MAX_SCORE_THRESHOLD = 1;

export default class ObjectDetectionMediaWidgetDescriptor extends WidgetDescriptor<ObjectDetectionMediaParams> {
  public getName(): string {
    return "ObjectDetectionMediaWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "media";
  }

  public supportCustomParams(): boolean {
    return true;
  }

  public getDefaultParams(): ObjectDetectionMediaParams {
    return {
      tfModel: "coco-ssd",
      detectionHz: 10,
      scoreThreshold: 0.5,
      flipH: false,
      flipV: false,
    };
  }

  public validateParams(params: ObjectDetectionMediaParams): string | null {
    const model = params?.tfModel;
    if (model !== undefined && model !== "coco-ssd") {
      return "ObjectDetectionMediaWidget supports only coco-ssd.";
    }

    if (
      typeof params?.detectionHz !== "number" ||
      !Number.isFinite(params.detectionHz) ||
      params.detectionHz < MIN_DETECTION_HZ ||
      params.detectionHz > MAX_DETECTION_HZ
    ) {
      return "detectionHz must be a number between 1 and 60.";
    }

    if (
      typeof params?.scoreThreshold !== "number" ||
      !Number.isFinite(params.scoreThreshold) ||
      params.scoreThreshold < MIN_SCORE_THRESHOLD ||
      params.scoreThreshold > MAX_SCORE_THRESHOLD
    ) {
      return "scoreThreshold must be a number between 0 and 1.";
    }

    if (typeof params?.flipH !== "boolean" || typeof params?.flipV !== "boolean") {
      return "flipH and flipV must be boolean.";
    }

    return null;
  }
}
