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
  public parallel?: number

  constructor(robotId: string, connectorId: string, parallel?: number) {
    this.robotId = robotId
    this.connectorId = connectorId
    this.parallel = parallel
  }

  public static deserialize(serialized: string): RobotConnector {
    const [robotId, connectorId] = serialized.split(":")
    return new RobotConnector(robotId, connectorId)
  }

  public serialize(): string {
    return `${this.robotId}:${this.connectorId}`
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
  dataType: string
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
