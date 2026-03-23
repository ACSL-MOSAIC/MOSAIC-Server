import { ButtonGroup, Button, Slider, Text, VStack, HStack } from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";

import { useMosaicWidget } from "@/components/Dashboard/Widgets/MosaicWidgetContext.tsx";
import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Field } from "@/components/ui/field.tsx";
import { PointCloud3DViewerParams } from "@/widgets/PointCloud3DViewerWidget/WidgetDescriptor.ts";

import type { ColorMode } from "./colorMapping.ts";

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: "height", label: "Height" },
  { value: "intensity", label: "Intensity" },
  { value: "depth", label: "Depth" },
  { value: "hybrid", label: "Hybrid" },
];

export function PointCloud3DViewerSetting() {
  const { params } = useMosaicWidget();

  const useFormReturn = useForm<PointCloud3DViewerParams>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      colorMode: (params?.colorMode as ColorMode) ?? "height",
      pointSize: (params?.pointSize as number) ?? 0.05,
      showAxes: (params?.showAxes as boolean) ?? false,
      autoRotate: (params?.autoRotate as boolean) ?? false,
    },
  });

  const { control, watch } = useFormReturn;
  const colorMode = watch("colorMode");
  const pointSize = watch("pointSize");

  return (
    <MosaicWidget.SettingDialog useFormReturn={useFormReturn}>
      <VStack gap={5} align="stretch">
        <Field label="Color Mode">
          <Controller
            name="colorMode"
            control={control}
            render={({ field }) => (
              <ButtonGroup size="xs" attached variant="outline">
                {COLOR_MODE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    onClick={() => field.onChange(opt.value)}
                    variant={colorMode === opt.value ? "solid" : "outline"}
                    colorPalette={colorMode === opt.value ? "blue" : "gray"}
                  >
                    {opt.label}
                  </Button>
                ))}
              </ButtonGroup>
            )}
          />
        </Field>

        <Field label={`Point Size: ${Math.round(pointSize * 1000)}`}>
          <Controller
            name="pointSize"
            control={control}
            render={({ field }) => (
              <Slider.Root
                value={[field.value * 1000]}
                onValueChange={(details) => field.onChange(details.value[0] / 1000)}
                min={10}
                max={200}
                step={5}
                w="100%"
              >
                <Slider.Control>
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumb index={0} />
                </Slider.Control>
              </Slider.Root>
            )}
          />
        </Field>

        <HStack gap={6}>
          <Field label="Show Axes">
            <Controller
              name="showAxes"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={({ checked }) => field.onChange(checked)}
                >
                  <Text fontSize="sm">Enable</Text>
                </Checkbox>
              )}
            />
          </Field>

          <Field label="Auto Rotate">
            <Controller
              name="autoRotate"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={({ checked }) => field.onChange(checked)}
                >
                  <Text fontSize="sm">Enable</Text>
                </Checkbox>
              )}
            />
          </Field>
        </HStack>
      </VStack>
    </MosaicWidget.SettingDialog>
  );
}
