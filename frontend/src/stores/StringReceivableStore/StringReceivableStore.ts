import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";

export class StringReceivableStore extends ReceivableStore<string> {
  public convertData(data: string): string {
    return data;
  }
}
