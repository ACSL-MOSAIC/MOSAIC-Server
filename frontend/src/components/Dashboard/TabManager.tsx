import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog"
import type {RobotInfo} from "@/contexts/WebSocketContext.tsx"
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import {useState} from "react"
import {FiEdit2, FiGrid, FiPlus, FiX} from "react-icons/fi"
import {AddWidgetModal} from "./AddWidgetModal"
import type {WidgetType} from "./types"

interface TabManagerProps {
  onAddTab: (tabName: string) => void
  onRemoveTab: (tabId: string) => void
  onRenameTab: (tabId: string, newName: string) => void
  tabs: Array<{ id: string; name: string }>
  activeTabId: string
  onTabChange: (tabId: string) => void
  onAddWidget: (type: WidgetType, robotId?: string, config?: any) => void
  onSaveChanges: () => void
  hasUnsavedChanges: boolean
  robots: RobotInfo[]
}

export function TabManager({
                             onAddTab,
                             onRemoveTab,
                             onRenameTab,
                             tabs,
                             activeTabId,
                             onTabChange,
                             onAddWidget,
                             onSaveChanges,
                             hasUnsavedChanges,
                             robots,
                           }: TabManagerProps) {
  const {open, onOpen, onClose} = useDisclosure()
  const {
    open: widgetModalOpen,
    onOpen: onWidgetModalOpen,
    onClose: onWidgetModalClose,
  } = useDisclosure()
  const [newTabName, setNewTabName] = useState("")
  const [editingTab, setEditingTab] = useState<{
    id: string
    name: string
  } | null>(null)
  const [editName, setEditName] = useState("")

  const handleAddTab = () => {
    if (newTabName.trim()) {
      onAddTab(newTabName.trim())
      setNewTabName("")
      onClose()
    }
  }

  const handleRenameTab = () => {
    if (editingTab && editName.trim()) {
      onRenameTab(editingTab.id, editName.trim())
      setEditingTab(null)
      setEditName("")
    }
  }

  const startEditTab = (tab: { id: string; name: string }) => {
    setEditingTab(tab)
    setEditName(tab.name)
  }

  const cancelEdit = () => {
    setEditingTab(null)
    setEditName("")
  }

  return (
    <Box mb={6}>
      <Box borderBottom="1px solid" borderColor="gray.200" bg="white" p={2}>
        <Flex justify="space-between" align="center">
          <HStack gap={6} flex="1">
            {tabs.map((tab) => (
              <Box
                key={tab.id}
                position="relative"
                cursor="pointer"
                onClick={() => onTabChange(tab.id)}
                py={3}
                px={4}
                borderRadius="md"
                transition="all 0.2s ease-in-out"
                _hover={{
                  bg: activeTabId === tab.id ? "blue.50" : "gray.50",
                }}
              >
                {editingTab?.id === tab.id ? (
                  <Input
                    size="sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleRenameTab()
                      } else if (e.key === "Escape") {
                        cancelEdit()
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    bg="white"
                    color="gray.800"
                    minW="120px"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="blue.300"
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.1)",
                    }}
                  />
                ) : (
                  <Text
                    fontSize="sm"
                    fontWeight={activeTabId === tab.id ? "600" : "500"}
                    color={activeTabId === tab.id ? "blue.600" : "gray.600"}
                    transition="all 0.2s ease-in-out"
                  >
                    {tab.name}
                  </Text>
                )}

                {/* Active tab bottom line */}
                {activeTabId === tab.id && (
                  <Box
                    position="absolute"
                    bottom="-2px"
                    left="0"
                    right="0"
                    height="2px"
                    bg="blue.500"
                    borderRadius="full"
                    boxShadow="0 1px 3px rgba(59, 130, 246, 0.3)"
                  />
                )}
              </Box>
            ))}
          </HStack>

          <HStack gap={2} ml={4}>
            {/* Add widget button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onWidgetModalOpen}
              color="gray.500"
              _hover={{
                bg: "blue.50",
                color: "blue.500",
              }}
              title="Add Widget"
            >
              <FiGrid size={14}/>
              Add Widget
            </Button>

            {editingTab?.id !== activeTabId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const currentTab = tabs.find((tab) => tab.id === activeTabId)
                  if (currentTab) {
                    startEditTab(currentTab)
                  }
                }}
                color="gray.500"
                _hover={{
                  bg: "gray.100",
                  color: "gray.700",
                }}
              >
                <FiEdit2 size={14}/>
                Edit Tab Name
              </Button>
            )}

            {tabs.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveTab(activeTabId)}
                color="gray.500"
                _hover={{
                  bg: "red.50",
                  color: "red.500",
                }}
              >
                <FiX size={14}/>
                Delete Tab
              </Button>
            )}

            <Button
              size="sm"
              onClick={onOpen}
              colorScheme="blue"
              variant="ghost"
              _hover={{
                bg: "blue.50",
              }}
            >
              <FiPlus size={14}/>
              Add Tab
            </Button>

            <Button
              colorScheme="teal"
              onClick={onSaveChanges}
              disabled={!hasUnsavedChanges}
            >
              💾 {hasUnsavedChanges ? "Save" : "Saved"}
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Add tab dialog */}
      <DialogRoot open={open} onOpenChange={({open}) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tab</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Input
              placeholder="Enter tab name"
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAddTab()
                }
              }}
              autoFocus
            />
          </DialogBody>
          <DialogFooter>
            <DialogCloseTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogCloseTrigger>
            <DialogActionTrigger asChild>
              <Button
                onClick={handleAddTab}
                disabled={!newTabName.trim()}
                colorScheme="blue"
              >
                Add
              </Button>
            </DialogActionTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Add widget modal */}
      <AddWidgetModal
        isOpen={widgetModalOpen}
        onClose={onWidgetModalClose}
        onAdd={onAddWidget}
        robots={robots}
      />
    </Box>
  )
}
