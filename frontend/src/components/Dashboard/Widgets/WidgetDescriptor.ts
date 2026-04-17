import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

export abstract class WidgetDescriptor<T = Record<string, any>> {
  public abstract getName(): string;

  public getRequiredStoreType(): StoreType | null {
    return null;
  }

  public getMinStoreNumber(): number {
    return 1;
  }

  public getMaxStoreNumber(): number {
    return 1;
  }

  public getMinRobotConnectorNumber(): number {
    return 1;
  }

  public getMaxRobotConnectorNumber(): number {
    return 1;
  }

  public supportCustomParams(): boolean {
    return false;
  }

  public getDefaultParams(): T {
    return {} as T;
  }

  public validateParams(_params: T): string | null {
    return null;
  }

  public getDefaultInjectData(): string {
    return "";
  }
}
