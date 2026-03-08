export type PPCData =
  | {
      dataPresent: true
      meta: PPCMeta
      points: PPCPoints
    }
  | { dataPresent: false }

export interface PPCMeta {
  timestamp: number
  receivedTimestamp: number
  frameId: string

  height: number
  width: number
  isBigEndian: boolean
  pointStep: number
  rowStep: number
  isDense: boolean

  xOffset: number
  yOffset: number
  zOffset: number
  intensityOffset: number

  min_x: number
  max_x: number
  min_y: number
  max_y: number
  min_z: number
  max_z: number

  chunks: Omit<PPCChunk, "data">[]
}

export interface PPCChunk {
  timestamp: number
  receivedTimestamp: number
  frameId: string
  chunkIndex: number
  pointSize: number
  data: Uint8Array<ArrayBufferLike>
}

export interface PPCPoints {
  points: PPCPoint[]
}

export interface PPCPoint {
  x: number | null
  y: number | null
  z: number | null
  intensity: number | null
}
