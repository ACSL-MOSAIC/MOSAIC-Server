import {
  Button,
  ButtonGroup,
  DialogActionTrigger,
  Input,
  NativeSelectField,
  NativeSelectRoot,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { FaExchangeAlt } from "react-icons/fa";

import type { ApiError } from "@/client";
import type { RobotInfoDto, RobotUpdateDto } from "@/client/service/robot.dto.ts";

import { getRobotApi, updateRobotApi } from "@/client/service/robot.api.ts";
import { ROBOT_AUTH_TYPES } from "@/client/service/robot.dto.ts";
import useCustomToast from "@/hooks/useCustomToast";
import { handleError } from "@/utils";

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Field } from "../ui/field";

interface EditRobotProps {
  robot: RobotInfoDto;
}

const EditRobotDialog = ({ robot }: EditRobotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccessToast } = useCustomToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RobotUpdateDto>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      ...robot,
      description: robot.description ?? undefined,
      connectorConfig: undefined,
    },
  });

  // Load connector config when dialog opens
  useEffect(() => {
    if (isOpen) {
      getRobotApi(robot.id)
        .then((response) => {
          // Format JSON with indentation for display
          const formattedConfig = JSON.stringify(JSON.parse(response.connectorConfig), null, 2);
          setValue("connectorConfig", formattedConfig);
        })
        .catch((error) => {
          console.error("Failed to load connector config:", error);
        });
    }
  }, [isOpen, robot.id, setValue]);

  const mutation = useMutation({
    mutationFn: (data: RobotUpdateDto) => updateRobotApi(robot.id, data),
    onSuccess: () => {
      showSuccessToast("Robot updated successfully.");
      reset();
      setIsOpen(false);
    },
    onError: (err: ApiError) => {
      handleError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["robots"] });
    },
  });

  const onSubmit: SubmitHandler<RobotUpdateDto> = async (data) => {
    // Stringify connector config without formatting before sending
    const submitData = {
      ...data,
      connectorConfig: data.connectorConfig
        ? JSON.stringify(JSON.parse(data.connectorConfig))
        : data.connectorConfig,
    };
    mutation.mutate(submitData);
  };

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button variant="ghost">
          <FaExchangeAlt fontSize="16px" />
          Edit Robot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Robot</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the robot details below.</Text>
            <VStack gap={4}>
              <Field required invalid={!!errors.name} errorText={errors.name?.message} label="Name">
                <Input
                  id="name"
                  {...register("name", {
                    required: "Name is required",
                  })}
                  placeholder="Name"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message}
                label="Description"
              >
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Description"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.authType}
                errorText={errors.authType?.message}
                label="Auth Type"
              >
                <NativeSelectRoot>
                  <NativeSelectField
                    id="authType"
                    {...register("authType", {
                      required: "Auth Type is required.",
                      valueAsNumber: true,
                    })}
                  >
                    {ROBOT_AUTH_TYPES.map((authType) => (
                      <option key={authType.value} value={authType.value}>
                        {authType.label}
                      </option>
                    ))}
                  </NativeSelectField>
                </NativeSelectRoot>
              </Field>

              <Field
                invalid={!!errors.connectorConfig}
                errorText={errors.connectorConfig?.message}
                label="Connector Config (JSON)"
                helperText="Optional: Leave empty to use default config"
              >
                <Textarea
                  id="connectorConfig"
                  {...register("connectorConfig", {
                    validate: (value) => {
                      if (!value) return true;
                      try {
                        JSON.parse(value);
                        return true;
                      } catch {
                        return "Invalid JSON format";
                      }
                    },
                  })}
                  placeholder='{"connectors":[]}'
                  rows={4}
                  fontFamily="monospace"
                  fontSize="sm"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <ButtonGroup>
              <DialogActionTrigger asChild>
                <Button variant="subtle" colorPalette="gray" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button variant="solid" type="submit" loading={isSubmitting}>
                Save
              </Button>
            </ButtonGroup>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
};

export default EditRobotDialog;
