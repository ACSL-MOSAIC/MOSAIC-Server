import { SendableStore } from "@/mosaic/store/interface/sendable-store.ts";

export type ConnectionCheckMessage = {
  messageCreated: number;
  extra?: string;
};

export class ConnectionCheckSenderStore extends SendableStore<ConnectionCheckMessage> {
  public send(data: ConnectionCheckMessage): void {
    this.sendData(JSON.stringify(data));
  }
}
