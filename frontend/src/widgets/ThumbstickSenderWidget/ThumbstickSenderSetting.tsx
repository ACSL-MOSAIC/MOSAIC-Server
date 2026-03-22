import { VStack } from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";

import { useMosaicWidget } from "@/components/Dashboard/Widgets/MosaicWidgetContext.tsx";
import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Field } from "@/components/ui/field.tsx";
import { ThumbstickParams } from "@/widgets/ThumbstickSenderWidget/WidgetDescriptor.ts";

export function ThumbstickSenderSetting() {
  const widgetConfig = useMosaicWidget();
  const useFormReturn = useForm<ThumbstickParams>({
    mode: "onBlur",
    defaultValues: {
      holonomic: widgetConfig.params.holonomic ?? false,
    },
  });

  const {
    formState: { errors },
    control,
  } = useFormReturn;

  return (
    <MosaicWidget.SettingDialog useFormReturn={useFormReturn}>
      <VStack gap={4} align="start">
        <Field
          invalid={!!errors.holonomic}
          errorText={errors.holonomic?.message}
          label="Holonomic"
          helperText="Enable holonomic (omnidirectional) drive mode."
        >
          <Controller
            name="holonomic"
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={({ checked }) => field.onChange(checked)}
              >
                Enable holonomic mode
              </Checkbox>
            )}
          />
        </Field>
      </VStack>
    </MosaicWidget.SettingDialog>
  );
}
