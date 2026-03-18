import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class BaseTemplateWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "BaseTemplateWidget";
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

  public validateParams(_params: Record<string, any>): string | null {
    return null;
  }
}
