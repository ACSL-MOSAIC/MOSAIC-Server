import type { WidgetConfig } from "@/mosaic"
import {
  type ComponentType,
  type LazyExoticComponent,
  Suspense,
  lazy,
} from "react"

type WidgetComponent = ComponentType<{ widgetConfig: WidgetConfig }>

const modules = import.meta.glob("./widgets/*.tsx")
const registry = new Map<string, LazyExoticComponent<WidgetComponent>>()
const LazyNotFoundWidget = lazy(
  () => import("./widgets/NotFoundWidget.tsx"),
) as LazyExoticComponent<WidgetComponent>

function getLazyWidget(type: string) {
  console.log("Render Lazy Widget type: ", type)
  if (registry.has(type)) return registry.get(type)!

  const entry = Object.entries(modules).find(([path]) =>
    path.includes(`/${type}.tsx`),
  )
  if (!entry) return null

  const component = lazy(
    entry[1] as () => Promise<{ default: WidgetComponent }>,
  )
  registry.set(type, component)
  console.log("Lazy Widget registered: ", type, component)
  return component
}

export interface WidgetFactoryProps {
  widgetConfig: WidgetConfig
}

export function WidgetFactory({ widgetConfig }: WidgetFactoryProps) {
  const LazyComponent = getLazyWidget(widgetConfig.type) ?? LazyNotFoundWidget

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent widgetConfig={widgetConfig} />
    </Suspense>
  )
}
