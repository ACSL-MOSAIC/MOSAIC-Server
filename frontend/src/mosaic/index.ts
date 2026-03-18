export type WidgetType = string;

export interface WidgetPositionConfig {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class RobotConnector {
  public robotId: string;
  public connectorId: string;

  constructor(robotId: string, connectorId: string) {
    this.robotId = robotId;
    this.connectorId = connectorId;
  }

  public static deserialize(serialized: string): RobotConnector {
    const [robotId, connectorId] = serialized.split(":");
    return new RobotConnector(robotId, connectorId);
  }

  public serialize(): string {
    return `${this.robotId}:${this.connectorId}`;
  }
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: WidgetPositionConfig;
  connectors: RobotConnector[];
  params?: any;
  onUpdateWidgetParams: (params?: any) => void;
}

export interface TabConfig {
  id: string;
  name: string;
  widgets: WidgetConfig[];
}

export interface ConnectorConfig {
  connectorId: string;
  connectorType: string;
  params: any;
}

export interface RobotConfig {
  connectors: ConnectorConfig[];
}

export const ROBOT_STATUSES = [
  { value: 0, label: "Ready to Connect" },
  { value: 1, label: "RTC Connecting" },
  { value: 2, label: "RTC Connected" },
  { value: 3, label: "RTC Disconnecting" },
  { value: 4, label: "RTC Failed" },
  { value: 5, label: "Disconnected" },
  { value: 6, label: "WS Connected" },
] as const;

export type RobotStatus = (typeof ROBOT_STATUSES)[number]["value"];

export enum RTCConnectionState {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  FAILED = 3,
  DISCONNECTING = 4,
}
