import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";

export class JsonReceivableStore extends ReceivableStore<any> {
  public convertData(data: string): any {
    return JSON.parse(data);
  }
}
