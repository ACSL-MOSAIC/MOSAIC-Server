import { ReceivableStore } from "@/mosaic/store/interface/receivable-store.ts"

export default class StringReceivableStore extends ReceivableStore<string> {
  static readonly connectorType = "string-receivable"
  connectorType = StringReceivableStore.connectorType

  public convertData(data: string): string {
    return data
  }
}
