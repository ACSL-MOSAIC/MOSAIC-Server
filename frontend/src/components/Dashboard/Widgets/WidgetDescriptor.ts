export abstract class WidgetDescriptor {
  public abstract getName(): string;

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

  public validateParams(_params: Record<string, any>): string | null {
    return null;
  }

  public getDefaultInjectData(): string {
    return "";
  }
}
