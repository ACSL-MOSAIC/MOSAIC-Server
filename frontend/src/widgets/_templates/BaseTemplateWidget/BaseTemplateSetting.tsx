import { VStack, Text, Input } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { MosaicWidget } from "@/components/Dashboard/Widgets/WidgetComponents.tsx";
import { Field } from "@/components/ui/field.tsx";

export function BaseTemplateSetting() {
  const useFormReturn = useForm<{ name: string }>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
    },
  });

  const {
    formState: { errors },
    register,
  } = useFormReturn;

  return (
    <MosaicWidget.SettingDialog useFormReturn={useFormReturn}>
      <Text mb={4}>You can customize this dialog</Text>
      <VStack gap={4}>
        <Field required invalid={!!errors.name} errorText={errors.name?.message} label="Name">
          <Input
            id="name"
            {...register("name", {
              required: "Name is required.",
            })}
            placeholder="Name"
            type="text"
          />
        </Field>
      </VStack>
    </MosaicWidget.SettingDialog>
  );
}
