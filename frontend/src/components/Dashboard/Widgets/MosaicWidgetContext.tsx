import { createContext, useContext } from "react";

import type { WidgetConfig } from "@/mosaic";

const MosaicWidgetContext = createContext<WidgetConfig | null>(null);

export function useMosaicWidget(): WidgetConfig {
  const ctx = useContext(MosaicWidgetContext);
  if (!ctx) {
    throw new Error("useMosaicWidget must be used within MosaicWidget.Root");
  }
  return ctx;
}

export { MosaicWidgetContext };