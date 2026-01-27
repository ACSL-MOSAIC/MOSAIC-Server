import {
  type DynamicTypeConfig,
  dynamicTypeManager,
} from "@/dashboard/dynamic/dynamic-type-config.ts"
import { useRobotMapping } from "@/hooks/useRobotMapping.ts"
import {
  Badge,
  Box,
  Button,
  Dialog,
  HStack,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useCallback, useEffect, useState } from "react"
import { IoAdd } from "react-icons/io5"
import { DynamicTypeList } from "./DynamicTypeList"

interface DynamicTypeManagerProps {
  robotId: string
  isOpen: boolean
  onClose: () => void
  onTypeUpdated?: () => void
}

// Quick templates
const QUICK_TEMPLATES = {
  "sensor-data": {
    name: "sensor-data",
    channelType: "readonly",
    schema: {
      type: "object",
      properties: {
        temperature: { type: "number" },
        humidity: { type: "number" },
        pressure: { type: "number" },
        timestamp: { type: "string", format: "date-time" },
      },
      required: ["temperature", "humidity", "timestamp"],
    },
    description: "Sensor data (temperature, humidity, pressure)",
  },
  "position-data": {
    name: "position-data",
    channelType: "readonly",
    schema: {
      type: "object",
      properties: {
        x: { type: "number" },
        y: { type: "number" },
        z: { type: "number" },
        heading: { type: "number" },
        timestamp: { type: "string", format: "date-time" },
      },
      required: ["x", "y", "timestamp"],
    },
    description: "Position data (x, y, z, direction)",
  },
  "control-command": {
    name: "control-command",
    channelType: "writeonly",
    schema: {
      type: "object",
      properties: {
        command: { type: "string", enum: ["start", "stop", "pause", "resume"] },
        speed: { type: "number", minimum: 0, maximum: 100 },
        direction: {
          type: "string",
          enum: ["forward", "backward", "left", "right"],
        },
        duration: { type: "number", minimum: 0 },
      },
      required: ["command"],
    },
    description: "Control command (start, stop, speed, direction)",
  },
}

export function DynamicTypeManager({
  robotId,
  isOpen,
  onClose,
  onTypeUpdated,
}: DynamicTypeManagerProps) {
  const [dynamicTypes, setDynamicTypes] = useState<DynamicTypeConfig[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingConfig, setEditingConfig] = useState<DynamicTypeConfig | null>(
    null,
  )

  const { getRobotName } = useRobotMapping()

  // Stabilize onTypeUpdated callback
  const stableOnTypeUpdated = useCallback(() => {
    onTypeUpdated?.()
  }, [onTypeUpdated])

  // Form state
  const [typeName, setTypeName] = useState("")
  const [description, setDescription] = useState("")
  const [channelType, setChannelType] = useState<"readonly" | "writeonly">(
    "readonly",
  )
  const [channelLabel, setChannelLabel] = useState("")
  const [jsonSchema, setJsonSchema] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load dynamic types list
  const loadDynamicTypes = useCallback(async () => {
    try {
      // DynamicTypeManager 초기화
      await dynamicTypeManager.initialize()
      const configs = dynamicTypeManager.getConfigsByRobotId(robotId)
      setDynamicTypes(configs)
    } catch (error) {
      console.error("Failed to load dynamic types:", error)
    }
  }, [robotId])

  // Execute resetForm only when isOpen becomes false
  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      loadDynamicTypes()
    }
  }, [isOpen, loadDynamicTypes])

  // JSON Schema validation
  const validateJsonSchema = (schema: string) => {
    try {
      const parsed = JSON.parse(schema)
      return parsed && typeof parsed === "object" && parsed.type
    } catch {
      return false
    }
  }

  // Validate when JSON Schema changes
  const handleJsonSchemaChange = (value: string) => {
    setJsonSchema(value)
    setIsValid(validateJsonSchema(value))
  }

  // Apply template
  const applyTemplate = (templateKey: keyof typeof QUICK_TEMPLATES) => {
    const template = QUICK_TEMPLATES[templateKey]
    setTypeName(template.name)
    setChannelType(template.channelType as "readonly" | "writeonly")
    setDescription(template.description)
    setJsonSchema(JSON.stringify(template.schema, null, 2))
    setIsValid(true)
  }

  // Reset form
  const resetForm = useCallback(() => {
    setTypeName("")
    setDescription("")
    setJsonSchema("")
    setChannelType("readonly")
    setChannelLabel("")
    setIsValid(false)
    setIsEditing(false)
    setEditingConfig(null)
  }, [])

  // Add new type
  const addNewType = useCallback(() => {
    resetForm()
    setIsEditing(true)
  }, [resetForm])

  // Start editing type
  const startEdit = useCallback((config: DynamicTypeConfig) => {
    setEditingConfig(config)
    setTypeName(config.name)
    setDescription(config.description || "")
    setChannelType(config.channelType)
    setChannelLabel(config.channelLabel || "")
    setJsonSchema(JSON.stringify(config.schema, null, 2))
    setIsValid(true)
    setIsEditing(true)
  }, [])

  // Delete type
  const deleteType = useCallback(
    async (configId: string) => {
      if (confirm("Are you sure you want to delete this dynamic type?")) {
        try {
          await dynamicTypeManager.deleteConfig(configId)
          loadDynamicTypes()
          stableOnTypeUpdated()
        } catch (error) {
          console.error("Failed to delete dynamic type:", error)
          alert("Failed to delete dynamic type. Please try again.")
        }
      }
    },
    [loadDynamicTypes, stableOnTypeUpdated],
  )

  // Save type (add or edit)
  const saveType = useCallback(async () => {
    if (!isValid || !typeName.trim()) {
      alert("Please enter a valid type name and JSON Schema.")
      return
    }

    if (!channelLabel.trim()) {
      alert(
        "Channel label is required. Please enter a WebRTC data channel label.",
      )
      return
    }

    setIsLoading(true)
    try {
      const schema = JSON.parse(jsonSchema)

      if (isEditing && editingConfig) {
        // Edit
        const success = await dynamicTypeManager.updateConfig(
          editingConfig.id,
          {
            name: typeName.trim(),
            schema,
            channelType,
            channelLabel: channelLabel.trim(),
            description: description.trim() || undefined,
          },
        )

        if (success) {
          alert(`Dynamic type "${typeName}" has been successfully updated!`)
        } else {
          alert("Failed to update dynamic type.")
        }
      } else {
        // Add new
        await dynamicTypeManager.registerDynamicType({
          robotId,
          name: typeName.trim(),
          schema,
          channelType,
          channelLabel: channelLabel.trim(),
          description: description.trim() || undefined,
        })

        alert(`Dynamic type "${typeName}" has been successfully registered!`)
      }

      resetForm()
      loadDynamicTypes()
      stableOnTypeUpdated()
    } catch (error) {
      console.error("Failed to save dynamic type:", error)
      alert("Failed to save dynamic type. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [
    isValid,
    typeName,
    jsonSchema,
    isEditing,
    editingConfig,
    robotId,
    channelType,
    channelLabel,
    description,
    resetForm,
    loadDynamicTypes,
    stableOnTypeUpdated,
  ])

  // Cancel
  const cancelEdit = useCallback(() => {
    resetForm()
  }, [resetForm])

  return (
    <>
      {/* IconButton은 이제 RobotConnectionPanel에서 처리됨 */}

      <Dialog.Root
        open={isOpen}
        onOpenChange={({ open }) => !open && onClose()}
      >
        <Dialog.Backdrop
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex={9998}
        />
        <Dialog.Positioner
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Dialog.Content
            maxW="900px"
            maxH="85vh"
            overflow="hidden"
            position="relative"
            zIndex={10000}
          >
            <Dialog.Header>
              <Dialog.Title fontSize="24px" fontWeight="bold" color="gray.800">
                Dynamic Type Management - {getRobotName(robotId)}
              </Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body p={6} overflowY="auto" maxH="70vh">
              {!isEditing ? (
                // View type list
                <VStack gap={6} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="20px" fontWeight="600" color="gray.800">
                      Registered Dynamic Types
                    </Text>
                    <Button size="sm" colorScheme="blue" onClick={addNewType}>
                      <IoAdd style={{ marginRight: "8px" }} />
                      Add New Type
                    </Button>
                  </HStack>

                  <DynamicTypeList
                    dynamicTypes={dynamicTypes}
                    onEdit={startEdit}
                    onDelete={deleteType}
                  />
                </VStack>
              ) : (
                // Type edit form
                <VStack gap={6} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="20px" fontWeight="600" color="gray.800">
                      {editingConfig
                        ? "Edit Dynamic Type"
                        : "Add New Dynamic Type"}
                    </Text>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </HStack>

                  {/* Quick templates */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={2}
                    >
                      Quick Templates
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      {Object.entries(QUICK_TEMPLATES).map(
                        ([key, template]) => (
                          <Badge
                            key={key}
                            colorScheme="blue"
                            variant="outline"
                            cursor="pointer"
                            onClick={() =>
                              applyTemplate(key as keyof typeof QUICK_TEMPLATES)
                            }
                            _hover={{ bg: "blue.50" }}
                          >
                            {template.name}
                          </Badge>
                        ),
                      )}
                    </HStack>
                  </Box>

                  {/* Type name */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={1}
                    >
                      Type Name *
                    </Text>
                    <Input
                      size="sm"
                      value={typeName}
                      onChange={(e) => setTypeName(e.target.value)}
                      placeholder="e.g., sensor-data, position-data"
                    />
                  </Box>

                  {/* Description */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={1}
                    >
                      Description
                    </Text>
                    <Input
                      size="sm"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter a description for the type"
                    />
                  </Box>

                  {/* Channel type */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={1}
                    >
                      Channel Type *
                    </Text>
                    <select
                      value={channelType}
                      onChange={(e) =>
                        setChannelType(
                          e.target.value as "readonly" | "writeonly",
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        fontSize: "14px",
                        backgroundColor: "white",
                      }}
                    >
                      <option value="readonly">Read Only</option>
                      <option value="writeonly">Write Only</option>
                    </select>
                  </Box>

                  {/* Channel label */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={1}
                    >
                      Channel Label *
                    </Text>
                    <Input
                      size="sm"
                      value={channelLabel}
                      onChange={(e) => setChannelLabel(e.target.value)}
                      placeholder={`${typeName || "type-name"}_data_channel`}
                      required
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      This is the label for the WebRTC data channel. Please
                      enter a unique name.
                    </Text>
                  </Box>

                  {/* JSON Schema */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={1}
                    >
                      JSON Schema *
                    </Text>
                    <Textarea
                      size="sm"
                      value={jsonSchema}
                      onChange={(e) => handleJsonSchemaChange(e.target.value)}
                      placeholder={`{
  "type": "object",
  "properties": {
    "temperature": { "type": "number" },
    "humidity": { "type": "number" }
  },
  "required": ["temperature", "humidity"]
}`}
                      rows={8}
                      fontFamily="mono"
                      fontSize="xs"
                    />
                    {jsonSchema && (
                      <Text
                        fontSize="xs"
                        color={isValid ? "green.600" : "red.600"}
                        mt={1}
                      >
                        {isValid
                          ? "✓ Valid JSON Schema"
                          : "✗ Invalid JSON Schema"}
                      </Text>
                    )}
                  </Box>

                  {/* Save button */}
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={saveType}
                    loading={isLoading}
                    disabled={!isValid || !typeName.trim()}
                    w="100%"
                  >
                    {isLoading
                      ? "Saving..."
                      : editingConfig
                        ? "Update"
                        : "Register"}
                  </Button>
                </VStack>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  )
}
