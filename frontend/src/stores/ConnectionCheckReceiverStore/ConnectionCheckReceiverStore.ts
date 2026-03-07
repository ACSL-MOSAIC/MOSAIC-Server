import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";

export type ConnectionCheckMessage = {
  messageCreated: number;
  extra?: string;
};

export class ConnectionCheckReceiverStore extends ReceivableStore<ConnectionCheckMessage> {
  public convertData(data: string): ConnectionCheckMessage {
    return JSON.parse(data);
  }
}
