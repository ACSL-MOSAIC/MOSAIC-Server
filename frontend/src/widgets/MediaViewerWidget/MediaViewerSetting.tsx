import { VStack, Text } from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";

import type { WidgetConfig } from "@/mosaic";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Field } from "@/components/ui/field.tsx";

interface MediaViewerSettingProps {
  widgetConfig: WidgetConfig;
}

export type MediaViewerParams = {
  flipH: boolean;
  flipV: boolean;
};

export function MediaViewerSetting({ widgetConfig }: MediaViewerSettingProps) {
  const useFormReturn = useForm<MediaViewerParams>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      flipH: widgetConfig.params?.flipH ?? false,
      flipV: widgetConfig.params?.flipV ?? false,
    },
  });

  const {
    formState: { errors },
    control,
  } = useFormReturn;

  return (
    <MosaicWidget.SettingDialog widgetConfig={widgetConfig} useFormReturn={useFormReturn}>
      <Text mb={4}>Media Viewer Settings</Text>
      <VStack gap={4} align="start">
        <Field
          invalid={!!errors.flipH}
          errorText={errors.flipH?.message}
          label="Flip Horizontal"
        >
          <Controller
            name="flipH"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={({ checked }) => field.onChange(checked)}
              >
                Flip horizontally
              </Checkbox>
            )}
          />
        </Field>
        <Field
          invalid={!!errors.flipV}
          errorText={errors.flipV?.message}
          label="Flip Vertical"
        >
          <Controller
            name="flipV"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={({ checked }) => field.onChange(checked)}
              >
                Flip vertically
              </Checkbox>
            )}
          />
        </Field>
      </VStack>
    </MosaicWidget.SettingDialog>
  );
}