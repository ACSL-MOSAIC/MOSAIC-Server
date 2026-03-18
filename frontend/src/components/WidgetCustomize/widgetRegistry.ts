import type { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

type WidgetDescriptorClass = new () => WidgetDescriptor;

const descriptorModules = import.meta.glob("../../widgets/*/WidgetDescriptor.ts", {
  eager: true,
}) as Record<string, { default: WidgetDescriptorClass }>;

const descriptorRegistry = new Map<string, WidgetDescriptor>();

for (const module of Object.values(descriptorModules)) {
  const descriptor = new module.default();
  descriptorRegistry.set(descriptor.getName(), descriptor);
}

export const availableWidgetTypes: string[] = [...descriptorRegistry.keys()].sort();

export function getWidgetDescriptor(widgetType: string): WidgetDescriptor | null {
  return descriptorRegistry.get(widgetType) ?? null;
}