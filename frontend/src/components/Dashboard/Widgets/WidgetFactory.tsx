import { type ComponentType, type LazyExoticComponent, Suspense, lazy } from "react";

import type { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";
import type { WidgetConfig } from "@/mosaic";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";

type WidgetComponent = ComponentType<{ widgetConfig: WidgetConfig }>;
type WidgetDescriptorClass = new () => WidgetDescriptor;

const descriptorModules = import.meta.glob("../../../widgets/*/WidgetDescriptor.ts", {
  eager: true,
}) as Record<string, { default: WidgetDescriptorClass }>;

const componentModules: Record<string, () => Promise<unknown>> = import.meta.glob(
  "../../../widgets/*/*.tsx",
);

const registry = new Map<string, WidgetDescriptor>();
const componentCache = new Map<string, LazyExoticComponent<WidgetComponent>>();

for (const module of Object.values(descriptorModules)) {
  const descriptor = new module.default();
  registry.set(descriptor.getName(), descriptor);
}

const LazyNotFoundWidget = lazy(
  () => import("../../../widgets/NotFoundWidget/NotFoundWidget.tsx"),
) as LazyExoticComponent<WidgetComponent>;

function getLazyWidget(type: string) {
  const descriptor = registry.get(type);
  if (!descriptor) return null;

  if (componentCache.has(type)) return componentCache.get(type)!;

  const name = descriptor.getName();
  const moduleLoader = componentModules[`../../../widgets/${name}/${name}.tsx`];
  if (!moduleLoader) return null;

  const component = lazy(moduleLoader as () => Promise<{ default: WidgetComponent }>);
  componentCache.set(type, component);
  return component;
}

export interface WidgetFactoryProps {
  widgetConfig: WidgetConfig;
}

export function WidgetFactory({ widgetConfig }: WidgetFactoryProps) {
  const descriptor = registry.get(widgetConfig.type);
  if (descriptor) {
    const validationError = descriptor.validateParams(widgetConfig.params ?? {});
    if (validationError) {
      return <MosaicWidget.Root widgetConfig={widgetConfig} error={validationError} />;
    }
  }

  const LazyComponent = getLazyWidget(widgetConfig.type) ?? LazyNotFoundWidget;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent widgetConfig={widgetConfig} />
    </Suspense>
  );
}
