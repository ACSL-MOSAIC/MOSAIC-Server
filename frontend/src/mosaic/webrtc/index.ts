import type {MosaicStore} from "@/mosaic/store/interface/mosaic-store.ts"
import type {RobotConnector} from "@/mosaic"

export interface ConnectorRequirement {
  robotConnector: RobotConnector
  stores: MosaicStore[]
}
