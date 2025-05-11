export type ControlDirection = "forward" | "backward" | "left" | "right" | "stop";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface PositionData {
  x: number;
  y: number;
  theta: number;
} 