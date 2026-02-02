import {BidirectionalStore} from "@/mosaic/store/interface/bidirectional-store.ts"

export class ConnectionCheckingStore extends BidirectionalStore<void> {
  public static dataType = "connection_check"

  private intervalId: number | null = null

  public afterConnected(): void {
    // TODO: implement
  }

  public afterDisconnected(): void {
    // TODO: implement
  }

  private connectionCheckInterval(): void {
    // TODO: implement
  }

  private replyCheck(data: ArrayBuffer): void {
    // TODO: implement
  }
}
