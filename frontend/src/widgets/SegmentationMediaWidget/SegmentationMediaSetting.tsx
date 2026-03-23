import { Button, ButtonGroup, Input, VStack } from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";

import { useMosaicWidget } from "@/components/Dashboard/Widgets/MosaicWidgetContext.tsx";
import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Field } from "@/components/ui/field.tsx";
import {
  DEEPLAB_BASE_OPTIONS,
  DeeplabBase,
  SegmentationMediaParams,
} from "@/widgets/SegmentationMediaWidget/WidgetDescriptor.ts";

const MIN_SEGMENTATION_HZ = 1;
const MAX_SEGMENTATION_HZ = 60;

export function SegmentationMediaSetting() {
  const widgetConfig = useMosaicWidget();
  const useFormReturn = useForm<SegmentationMediaParams>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      tfModel: "deeplab",
      deeplabBase: (widgetConfig.params?.deeplabBase as DeeplabBase) ?? "pascal",
      segmentationHz: widgetConfig.params?.segmentationHz ?? 10,
      flipH: widgetConfig.params?.flipH ?? false,
      flipV: widgetConfig.params?.flipV ?? false,
    },
  });

  const {
    formState: { errors },
    control,
    watch,
  } = useFormReturn;
  const deeplabBase = watch("deeplabBase");

  return (
    <MosaicWidget.SettingDialog useFormReturn={useFormReturn}>
      <VStack gap={4} align="stretch">
        <Field required label="DeepLab Base" invalid={!!errors.deeplabBase}>
          <Controller
            name="deeplabBase"
            control={control}
            rules={{ required: "DeepLab base is required." }}
            render={({ field }) => (
              <ButtonGroup size="xs" attached variant="outline">
                {DEEPLAB_BASE_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    onClick={() => field.onChange(option)}
                    variant={deeplabBase === option ? "solid" : "outline"}
                    colorPalette={deeplabBase === option ? "blue" : "gray"}
                  >
                    {option}
                  </Button>
                ))}
              </ButtonGroup>
            )}
          />
        </Field>

        <Field
          required
          invalid={!!errors.segmentationHz}
          errorText={errors.segmentationHz?.message}
          label="Segmentation Frequency (Hz)"
        >
          <Controller
            name="segmentationHz"
            control={control}
            rules={{
              required: "Segmentation frequency is required.",
              min: { value: MIN_SEGMENTATION_HZ, message: "Minimum is 1 Hz." },
              max: { value: MAX_SEGMENTATION_HZ, message: "Maximum is 60 Hz." },
            }}
            render={({ field }) => (
              <Input
                type="number"
                min={MIN_SEGMENTATION_HZ}
                max={MAX_SEGMENTATION_HZ}
                step={1}
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
