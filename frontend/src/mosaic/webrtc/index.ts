import type { RobotConnector } from "@/mosaic"
import type {
  MosaicStore,
  StoreType,
} from "@/mosaic/store/interface/mosaic-store.ts"

export interface ConnectorRequirement {
  robotConnector: RobotConnector
  storeType: StoreType
  parallelNum?: number
  stores: MosaicStore[]
}
