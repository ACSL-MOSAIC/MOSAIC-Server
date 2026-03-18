import { createFileRoute } from "@tanstack/react-router";

import { WidgetCustomizePage } from "@/components/WidgetCustomize/WidgetCustomizePage.tsx";

export const Route = createFileRoute("/_layout/widget-customize")({
  component: WidgetCustomizePage,
});
