import {
  addTabApi,
  getTabListApi,
  updateTabConfigApi,
} from "@/client/service/dashboard.api.ts"
import useCustomToast from "@/hooks/useCustomToast"
import { Button, Input } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { FaPlus } from "react-icons/fa"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

const DEFAULT_DASHBOARD_CONFIG = { widgets: [] }

interface AddDashboardDialogProps {
  onCreated: (tabId: string) => void
}

const AddDashboardDialog = ({ onCreated }: AddDashboardDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: async (tabName: string) => addTabApi({ name: tabName }),
    onSuccess: async (_result, tabName) => {
      showSuccessToast("Dashboard tab created.")
      const nextTabs = await queryClient.fetchQuery({
        queryKey: ["dashboardTabs"],
        queryFn: getTabListApi,
      })

      const createdTab = [...nextTabs]
        .reverse()
        .find((tab) => tab.name === tabName)

      if (createdTab) {
        try {
          await updateTabConfigApi(createdTab.id, {
            tabConfig: JSON.stringify(DEFAULT_DASHBOARD_CONFIG),
          })
          await queryClient.invalidateQueries({
            queryKey: ["dashboardTabConfig", createdTab.id],
          })
        } catch {
          showErrorToast("Default dashboard config initialization failed.")
        }
        onCreated(createdTab.id)
      }

      setName("")
      setIsOpen(false)
    },
    onError: () => {
      showErrorToast("Failed to create dashboard tab.")
    },
  })

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      showErrorToast("Tab name is required.")
      return
    }
    mutation.mutate(trimmed)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "sm" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => {
        if (!open) setName("")
        setIsOpen(open)
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" colorPalette="blue">
          <FaPlus />
          Add Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent ref={dialogContentRef}>
        <DialogHeader>
          <DialogTitle>Add Dashboard</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field label="Dashboard Name" required>
            <Input
              placeholder="Dashboard name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit()
              }}
              autoFocus
            />
          </Field>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button
              variant="subtle"
              colorPalette="gray"
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            onClick={handleSubmit}
            loading={mutation.isPending}
            disabled={name.trim().length === 0}
          >
            Add
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddDashboardDialog
