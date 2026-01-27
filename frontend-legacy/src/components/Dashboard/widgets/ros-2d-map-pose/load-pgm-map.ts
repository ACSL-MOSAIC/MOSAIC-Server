import { PNMDecoder, type TupleType } from "@imgdrop/pnm"

export type PgmMapData = {
  width: number
  height: number
  tupltype: TupleType
  maxval: number
  data: Uint8Array | Uint16Array
}

export const loadPgmMap = async (pgmFile: File): Promise<PgmMapData | null> => {
  try {
    const arrayBuffer = await pgmFile.arrayBuffer()

    const pnmDecoder = new PNMDecoder(() => {
      return arrayBuffer
    })
    pnmDecoder.decode()

    return {
      width: pnmDecoder.width,
      height: pnmDecoder.height,
      tupltype: pnmDecoder.tupltype,
      maxval: pnmDecoder.maxval,
      data: pnmDecoder.data,
    }
  } catch (error) {
    alert("Failed to load PGM file. Please check the file format.")
    console.error("Error parsing PGM file:", error)
    return null
  }
}
