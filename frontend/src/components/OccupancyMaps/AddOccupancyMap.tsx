import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FaPlus } from "react-icons/fa"

import type { ApiError } from "@/client/core/ApiError"
import { createOccupancyMapApi } from "@/client/service/occupancy-map.api.ts"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface OccupancyMapForm {
  name: string
  pgmFile: FileList
  yamlFile: FileList
}

const AddOccupancyMap = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<OccupancyMapForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
    },
  })

  const mutation = useMutation({
    mutationFn: ({
      name,
      pgmFile,
      yamlFile,
    }: {
      name: string
      pgmFile: File
      yamlFile: File
    }) => createOccupancyMapApi(name, pgmFile, yamlFile),
    onSuccess: () => {
      showSuccessToast("Occupancy map created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["occupancy-maps"] })
    },
  })

  const onSubmit: SubmitHandler<OccupancyMapForm> = (data) => {
    const pgmFile = data.pgmFile[0]
    const yamlFile = data.yamlFile[0]

    if (!pgmFile || !yamlFile) {
      return
    }

    mutation.mutate({
      name: data.name,
      pgmFile,
      yamlFile,
    })
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-occupancy-map" my={4}>
          <FaPlus fontSize="16px" />
          Add Occupancy Map
        </Button>
      </DialogTrigger>
      <DialogContent ref={dialogContentRef}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Occupancy Map</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Fill in the details and upload files to add a new occupancy map.
            </Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Name"
              >
                <Input
                  id="name"
                  {...register("name", {
                    required: "Name is required.",
                  })}
                  placeholder="Map name"
                  type="text"
                />
              </Field>

              <Field
                required
                invalid={!!errors.pgmFile}
                errorText={errors.pgmFile?.message}
                label="PGM File"
              >
                <Input
                  id="pgmFile"
                  {...register("pgmFile", {
                    required: "PGM file is required.",
                    validate: {
                      fileType: (files) => {
                        if (!files || files.length === 0) return true
                        const file = files[0]
                        return (
                          file.name.endsWith(".pgm") ||
                          "File must have .pgm extension"
                        )
                      },
                    },
                  })}
                  type="file"
                  accept=".pgm"
                  py={1}
                />
              </Field>

              <Field
                required
                invalid={!!errors.yamlFile}
                errorText={errors.yamlFile?.message}
                label="YAML File"
              >
                <Input
                  id="yamlFile"
                  {...register("yamlFile", {
                    required: "YAML file is required.",
                    validate: {
                      fileType: (files) => {
                        if (!files || files.length === 0) return true
                        const file = files[0]
                        return (
                          file.name.endsWith(".yaml") ||
                          "File must have .yaml extension"
                        )
                      },
                    },
                  })}
                  type="file"
                  accept=".yaml"
                  py={1}
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddOccupancyMap
