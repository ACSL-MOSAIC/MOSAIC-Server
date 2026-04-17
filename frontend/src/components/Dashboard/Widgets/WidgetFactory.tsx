import { type ComponentType, type LazyExoticComponent, Suspense, lazy } from "react";

import type { WidgetConfig } from "@/mosaic";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { getWidgetDescriptor, getWidgetModuleLoader } from "@/widgets/_utils/widgetRegistry.ts";

type WidgetComponent = ComponentType<{ widgetConfig: WidgetConfig }>;

const componentCache = new Map<string, LazyExoticComponent<WidgetComponent>>();

const LazyNotFoundWidget = lazy(
  () => import("../../../widgets/NotFoundWidget/NotFoundWidget.tsx"),
) as LazyExoticComponent<WidgetComponent>;

function getLazyWidget(type: string) {
  const descriptor = getWidgetDescriptor(type);
  if (!descriptor) return null;

  if (componentCache.has(type)) return componentCache.get(type)!;

  const name = descriptor.getName();
  const moduleLoader = getWidgetModuleLoader(name);
  if (!moduleLoader) return null;

  const component = lazy(moduleLoader as () => Promise<{ default: WidgetComponent }>);
  componentCache.set(type, component);
  return component;
}

export interface WidgetFactoryProps {
  widgetConfig: WidgetConfig;
}

export function WidgetFactory({ widgetConfig }: WidgetFactoryProps) {
  const descriptor = getWidgetDescriptor(widgetConfig.type);
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
