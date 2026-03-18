import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class JsonViewerWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "JsonViewerWidget";
  }

  public getDefaultInjectData(): string {
    return '{"message": "Hello, World!"}';
  }
}
