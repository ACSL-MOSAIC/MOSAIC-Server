import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class ConnectionCheckWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "ConnectionCheckWidget";
  }

  public getMinStoreNumber(): number {
    return 2;
  }

  public getMaxStoreNumber(): number {
    return 2;
  }

  public getMinRobotConnectorNumber(): number {
    return 2;
  }

  public getMaxRobotConnectorNumber(): number {
    return 2;
  }

  // TODO: sender/receiver 두 커넥터를 동시에 사용하는 구조라 단일 inject로 표현 불가
}