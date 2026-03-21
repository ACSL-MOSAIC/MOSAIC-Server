import { Button, DialogActionTrigger, DialogTitle } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactNode, useRef, useState } from "react";
import { FieldValues, type SubmitHandler, UseFormReturn } from "react-hook-form";
import { IoSettings } from "react-icons/io5";

import type { ApiError } from "@/client";

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import useCustomToast from "@/hooks/useCustomToast.ts";
import { handleError } from "@/utils";

import { useMosaicWidget } from "./MosaicWidgetContext.tsx";

export interface WidgetSettingDialogProps<T extends FieldValues> {
  children?: ReactNode;
  useFormReturn: UseFormReturn<T>;
}

export function WidgetSettingDialog<T extends FieldValues>({
  children,
  useFormReturn: {
    handleSubmit,
    reset,
    formState: { isValid, isSubmitting },
  },
}: WidgetSettingDialogProps<T>) {
  const widgetConfig = useMosaicWidget();
  const { showSuccessToast } = useCustomToast();
  const [isOpen, setIsOpen] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: T) => {
      widgetConfig.onUpdateWidgetParams(data);
    },
    onSuccess: (_, variables) => {
      showSuccessToast("Settings saved successfully.");
      reset(variables);
      setIsOpen(false);
    },
    onError: (err: ApiError) => {
      handleError(err);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["robots"] });
    },
  });

  const onSubmit: SubmitHandler<any> = (data: T) => {
    mutation.mutate(data);
  };

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button size="xs" variant="outline">
          <IoSettings />
        </Button>
      </DialogTrigger>
      <DialogContent ref={dialogContentRef}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Change Setting</DialogTitle>
          </DialogHeader>
          <DialogBody>{children}</DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button variant="subtle" colorPalette="gray" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button variant="solid" type="submit" disabled={!isValid} loading={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
