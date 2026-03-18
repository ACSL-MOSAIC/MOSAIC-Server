import type { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

type WidgetDescriptorClass = new () => WidgetDescriptor;

const descriptorModules = import.meta.glob<{ default: WidgetDescriptorClass }>(
  "../*/WidgetDescriptor.ts",
  { eager: true },
);

const componentModules: Record<string, () => Promise<unknown>> = import.meta.glob("../*/*.tsx");

export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private readonly descriptorMap = new Map<string, WidgetDescriptor>();

  private constructor() {
    for (const module of Object.values(descriptorModules)) {
      const descriptor = new module.default();
      this.descriptorMap.set(descriptor.getName(), descriptor);
    }
  }

  public static getInstance(): WidgetRegistry {
    return this.instance || (this.instance = new WidgetRegistry());
  }

  public getAvailableWidgetTypes(): string[] {
    return [...this.descriptorMap.keys()].sort();
  }

  public getWidgetDescriptor(widgetType: string): WidgetDescriptor | null {
    return this.descriptorMap.get(widgetType) ?? null;
  }

  public getWidgetModuleLoader(name: string): (() => Promise<unknown>) | null {
    return componentModules[`../${name}/${name}.tsx`] ?? null;
  }
}

export function getAvailableWidgetTypes(): string[] {
  return WidgetRegistry.getInstance().getAvailableWidgetTypes();
}

export function getWidgetDescriptor(widgetType: string): WidgetDescriptor | null {
  return WidgetRegistry.getInstance().getWidgetDescriptor(widgetType);
}

export function getWidgetModuleLoader(name: string): (() => Promise<unknown>) | null {
  return WidgetRegistry.getInstance().getWidgetModuleLoader(name);
}
