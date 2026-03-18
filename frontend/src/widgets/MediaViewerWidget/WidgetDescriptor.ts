import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class MediaViewerWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "MediaViewerWidget";
  }

  public supportCustomParams(): boolean {
    return true;
  }

  public validateParams(_params: Record<string, any>): string | null {
    return null;
  }
}