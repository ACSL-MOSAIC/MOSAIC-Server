import { VStack, Text } from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";

import { useMosaicWidget } from "@/components/Dashboard/Widgets/MosaicWidgetContext.tsx";
import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Field } from "@/components/ui/field.tsx";
import { JsonViewerParams } from "@/widgets/JsonViewerWidget/WidgetDescriptor.ts";

export function JsonViewerSetting() {
  const widgetConfig = useMosaicWidget();
  const useFormReturn = useForm<JsonViewerParams>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      cumulative: widgetConfig.params.cumulative || false,
    },
  });

  const {
    formState: { errors },
    control,
  } = useFormReturn;

  return (
    <MosaicWidget.SettingDialog useFormReturn={useFormReturn}>
      <Text mb={4}>JSON Viewer Settings</Text>
      <VStack gap={4} align="start">
        <Field
          invalid={!!errors.cumulative}
          errorText={errors.cumulative?.message}
          label="Cumulative"
          helperText="Accumulate incoming data instead of replacing it."
        >
          <Controller
            name="cumulative"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={({ checked }) => field.onChange(checked)}
              >
                Enable cumulative mode
              </Checkbox>
            )}
          />
        </Field>
      </VStack>
    </MosaicWidget.SettingDialog>
  );
}
