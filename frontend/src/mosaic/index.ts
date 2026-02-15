export type MosaicDataType =
  | "media"
  | "byte-r2u" | "byte-r2u-p"
  | "byte-u2r" | "byte-u2r-p"
  | "string-r2u" | "string-r2u-p"
  | "string-u2r" | "string-u2r-p"
  | "json-r2u" | "json-r2u-p"
  | "json-u2r" | "json-u2r-p"

// TODO: Define WidgetType
export type WidgetType = string

export interface WidgetPositionConfig {
  x: number
  y: number
  w: number
  h: number
}

export class RobotConnector {
  public robotId: string
  public connectorId: string
  public dataType: MosaicDataType
  public parallelNum: number

  constructor(robotId: string, connectorId: string, dataType: MosaicDataType, parallelNum = 1) {
    this.robotId = robotId
    this.connectorId = connectorId
    this.dataType = dataType
    this.parallelNum = parallelNum
  }

  public static fromConnectorConfig(connectorConfig: ConnectorConfig) {
    if (connectorConfig.dataType.endsWith("-p")) {
      return new RobotConnector(connectorConfig.connectorId, connectorConfig.connectorId, connectorConfig.dataType, connectorConfig.params?.parallelNum)
    }
    return new RobotConnector(connectorConfig.connectorId, connectorConfig.connectorId, connectorConfig.dataType)
  }

  public static deserialize(serialized: string): RobotConnector {
    const [robotId, connectorId, dataType] = serialized.split(":")
    return new RobotConnector(robotId, connectorId, dataType as MosaicDataType)
  }

  public serialize(): string {
    return `${this.robotId}:${this.connectorId}:${this.dataType}`
  }
}

export interface WidgetConfig {
  id: string
  type: WidgetType
  position: WidgetPositionConfig
  connectors: RobotConnector[]

  [key: string]: any // for ...others
}

export interface DashboardConfig {
  id: string
  name: string
  widgets: WidgetConfig[]
}

export interface ConnectorConfig {
  connectorId: string
  connectorType: string
  dataType: MosaicDataType
  params: any
}

export interface RobotConfig {
  id: string
  name: string
  connectors: ConnectorConfig[]
}

export enum RTCConnectionState {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  FAILED = 3,
  DISCONNECTING = 4,
}
