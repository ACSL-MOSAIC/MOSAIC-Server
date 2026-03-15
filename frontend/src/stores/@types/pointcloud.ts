export type PointCloudData =
  | {
      dataPresent: true;
      meta: PointCloudMeta;
      points: PointCloudPoint[];
    }
  | { dataPresent: false };

export type PointCloudMeta = {
  timestamp: number;
  receivedTimestamp: number;
  frameId: string;

  height: number;
  width: number;
  isBigEndian: boolean;
  pointStep: number;
  rowStep: number;
  isDense: boolean;

  xOffset: number;
  yOffset: number;
  zOffset: number;
  intensityOffset: number;

  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
  min_z: number;
  max_z: number;

  expected_chunk_num: number;

  chunks: Omit<PointCloudChunk, "data">[];
};

export type PointCloudChunk = {
  timestamp: number;
  receivedTimestamp: number;
  frameId: string;
  chunkIndex: number;
  pointSize: number;
  data: Uint8Array<ArrayBufferLike>;
};

export type PointCloudPoint = {
  x: number | null;
  y: number | null;
  z: number | null;
  intensity: number | null;
};
