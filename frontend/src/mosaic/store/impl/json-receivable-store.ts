import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts";

export default class JsonReceivableStore extends ReceivableStore<any> {
  static readonly connectorType = "json-receivable";
  connectorType = JsonReceivableStore.connectorType;

  public convertData(data: string): any {
    return JSON.parse(data);
  }
}
