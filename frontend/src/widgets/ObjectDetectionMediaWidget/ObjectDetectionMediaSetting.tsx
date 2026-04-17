import { Input, VStack } from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";

import { useMosaicWidget } from "@/components/Dashboard/Widgets/MosaicWidgetContext.tsx";
import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Field } from "@/components/ui/field.tsx";
import { ObjectDetectionMediaParams } from "@/widgets/ObjectDetectionMediaWidget/WidgetDescriptor.ts";

const MIN_DETECTION_HZ = 1;
const MAX_DETECTION_HZ = 60;
const MIN_SCORE_THRESHOLD = 0;
const MAX_SCORE_THRESHOLD = 1;

export function ObjectDetectionMediaSetting() {
  const widgetConfig = useMosaicWidget();
  const useFormReturn = useForm<ObjectDetectionMediaParams>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      tfModel: "coco-ssd",
      detectionHz: widgetConfig.params?.detectionHz ?? 10,
      scoreThreshold: widgetConfig.params?.scoreThreshold ?? 0.5,
      flipH: widgetConfig.params?.flipH ?? false,
      flipV: widgetConfig.params?.flipV ?? false,
    },
  });

  const {
    formState: { errors },
    control,
  } = useFormReturn;

  return (
    <MosaicWidget.SettingDialog useFormReturn={useFormReturn}>
      <VStack gap={4} align="stretch">
        <Field
          required
          invalid={!!errors.detectionHz}
          errorText={errors.detectionHz?.message}
          label="Detection Frequency (Hz)"
        >
          <Controller
            name="detectionHz"
            control={control}
            rules={{
              required: "Detection frequency is required.",
              min: { value: MIN_DETECTION_HZ, message: "Minimum is 1 Hz." },
              max: { value: MAX_DETECTION_HZ, message: "Maximum is 60 Hz." },
            }}
            render={({ field }) => (
              <Input
                type="number"
                min={MIN_DETECTION_HZ}
                max={MAX_DETECTION_HZ}
                step={1}
                value={field.value}
                onChange={(event) => field.onChange(Number(event.target.value))}
              />
            )}
          />
        </Field>

        <Field
          required
          invalid={!!errors.scoreThreshold}
          errorText={errors.scoreThreshold?.message}
          label="Score Threshold"
          helperText="0 ~ 1 (higher values show fewer boxes)"
        >
          <Controller
            name="scoreThreshold"
            control={control}
            rules={{
              required: "Score threshold is required.",
              min: { value: MIN_SCORE_THRESHOLD, message: "Minimum is 0." },
              max: { value: MAX_SCORE_THRESHOLD, message: "Maximum is 1." },
            }}
            render={({ field }) => (
              <Input
                type="number"
                min={MIN_SCORE_THRESHOLD}
                max={MAX_SCORE_THRESHOLD}
                step={0.01}
                value={field.value}
                onChange={(event) => field.onChange(Number(event.target.value))}
              />
            )}
          />
        </Field>

        <Field invalid={!!errors.flipH} errorText={errors.flipH?.message} label="Flip Horizontal">
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

        <Field invalid={!!errors.flipV} errorText={errors.flipV?.message} label="Flip Vertical">
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
