import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts"
import { SendableStore } from "@/mosaic/store/interface/sendable-store.ts"

export type ConnectionCheckMessage = {
  messageCreated: number
  extra?: string
}

export class ConnectionCheckSenderStore extends SendableStore<ConnectionCheckMessage> {
  static readonly connectorType = "connection-check-sender"
  connectorType = ConnectionCheckSenderStore.connectorType

  public send(data: ConnectionCheckMessage): void {
    this.sendData(JSON.stringify(data))
  }
}

export class ConnectionCheckReceiverStore extends ReceivableStore<ConnectionCheckMessage> {
  static readonly connectorType = "connection-check-receiver"
  connectorType = ConnectionCheckReceiverStore.connectorType

  public convertData(data: string): ConnectionCheckMessage {
    return JSON.parse(data)
  }
}
