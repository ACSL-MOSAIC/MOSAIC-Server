import {
  Badge,
  Box,
  Button,
  Dialog,
  HStack,
  IconButton,
  Input,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import React, { useState, useEffect, useCallback } from "react"
import { IoAdd, IoSettings } from "react-icons/io5"
import {
  type DynamicTypeConfig,
  dynamicTypeManager,
} from "../../dashboard/dynamic/dynamic-type-config"
import { DynamicTypeList } from "./DynamicTypeList"

interface DynamicTypeManagerProps {
  robotId: string
  isOpen: boolean
  onClose: () => void
  onTypeUpdated?: () => void
}

// 빠른 템플릿들
const QUICK_TEMPLATES = {
  "sensor-data": {
    name: "sensor-data",
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
    description: "센서 데이터 (온도, 습도, 압력)",
  },
  "position-data": {
    name: "position-data",
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
    description: "위치 데이터 (x, y, z, 방향)",
  },
  "control-command": {
    name: "control-command",
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
    description: "제어 명령 (시작, 정지, 속도, 방향)",
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

  // onTypeUpdated 콜백을 안정화
  const stableOnTypeUpdated = useCallback(() => {
    onTypeUpdated?.()
  }, [onTypeUpdated])

  // 폼 상태
  const [typeName, setTypeName] = useState("")
  const [description, setDescription] = useState("")
  const [channelType, setChannelType] = useState<"readonly" | "writeonly">(
    "readonly",
  )
  const [channelLabel, setChannelLabel] = useState("")
  const [jsonSchema, setJsonSchema] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 동적 타입 목록 로드
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

  // isOpen이 false가 될 때만 resetForm 실행
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

  // JSON Schema 유효성 검사
  const validateJsonSchema = (schema: string) => {
    try {
      const parsed = JSON.parse(schema)
      return parsed && typeof parsed === "object" && parsed.type
    } catch {
      return false
    }
  }

  // JSON Schema 변경 시 유효성 검사
  const handleJsonSchemaChange = (value: string) => {
    setJsonSchema(value)
    setIsValid(validateJsonSchema(value))
  }

  // 템플릿 적용
  const applyTemplate = (templateKey: keyof typeof QUICK_TEMPLATES) => {
    const template = QUICK_TEMPLATES[templateKey]
    setTypeName(template.name)
    setDescription(template.description)
    setJsonSchema(JSON.stringify(template.schema, null, 2))
    setIsValid(true)
  }

  // 폼 초기화
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

  // 새 타입 추가
  const addNewType = useCallback(() => {
    resetForm()
    setIsEditing(true)
  }, [resetForm])

  // 타입 수정 시작
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

  // 타입 삭제
  const deleteType = useCallback(
    async (configId: string) => {
      if (confirm("정말로 이 동적 타입을 삭제하시겠습니까?")) {
        try {
          await dynamicTypeManager.deleteConfig(configId)
          loadDynamicTypes()
          stableOnTypeUpdated()
        } catch (error) {
          console.error("동적 타입 삭제 실패:", error)
          alert("동적 타입 삭제에 실패했습니다. 다시 시도해주세요.")
        }
      }
    },
    [loadDynamicTypes, stableOnTypeUpdated],
  )

  // 타입 저장 (추가 또는 수정)
  const saveType = useCallback(async () => {
    if (!isValid || !typeName.trim()) {
      alert("유효한 타입 이름과 JSON Schema를 입력해주세요.")
      return
    }

    if (!channelLabel.trim()) {
      alert(
        "채널 라벨은 필수값입니다. WebRTC 데이터 채널의 라벨을 입력해주세요.",
      )
      return
    }

    setIsLoading(true)
    try {
      const schema = JSON.parse(jsonSchema)

      if (isEditing && editingConfig) {
        // 수정
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
          alert(`동적 타입 "${typeName}"이 성공적으로 수정되었습니다!`)
        } else {
          alert("동적 타입 수정에 실패했습니다.")
        }
      } else {
        // 새로 추가
        const configId = await dynamicTypeManager.registerDynamicType({
          robotId,
          name: typeName.trim(),
          schema,
          channelType,
          channelLabel: channelLabel.trim(),
          description: description.trim() || undefined,
        })

        alert(`동적 타입 "${typeName}"이 성공적으로 등록되었습니다!`)
      }

      resetForm()
      loadDynamicTypes()
      stableOnTypeUpdated()
    } catch (error) {
      console.error("동적 타입 저장 실패:", error)
      alert("동적 타입 저장에 실패했습니다. 다시 시도해주세요.")
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

  // 취소
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
                동적 타입 관리 - {robotId}
              </Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body p={6} overflowY="auto" maxH="70vh">
              {!isEditing ? (
                // 타입 목록 보기
                <VStack gap={6} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="20px" fontWeight="600" color="gray.800">
                      등록된 동적 타입들
                    </Text>
                    <Button size="sm" colorScheme="blue" onClick={addNewType}>
                      <IoAdd style={{ marginRight: "8px" }} />새 타입 추가
                    </Button>
                  </HStack>

                  <DynamicTypeList
                    dynamicTypes={dynamicTypes}
                    onEdit={startEdit}
                    onDelete={deleteType}
                  />
                </VStack>
              ) : (
                // 타입 편집 폼
                <VStack gap={6} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="20px" fontWeight="600" color="gray.800">
                      {editingConfig ? "동적 타입 수정" : "새 동적 타입 추가"}
                    </Text>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      취소
                    </Button>
                  </HStack>

                  {/* 빠른 템플릿 */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={2}
                    >
                      빠른 템플릿
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

                  {/* 타입 이름 */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={1}
                    >
                      타입 이름 *
                    </Text>
                    <Input
                      size="sm"
                      value={typeName}
                      onChange={(e) => setTypeName(e.target.value)}
                      placeholder="예: sensor-data, position-data"
                    />
                  </Box>

                  {/* 설명 */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={1}
                    >
                      설명
                    </Text>
                    <Input
                      size="sm"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="타입에 대한 설명을 입력하세요"
                    />
                  </Box>

                  {/* 채널 타입 */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={1}
                    >
                      채널 타입 *
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
                      <option value="readonly">읽기 전용 (ReadOnly)</option>
                      <option value="writeonly">쓰기 전용 (WriteOnly)</option>
                    </select>
                  </Box>

                  {/* 채널 라벨 */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="medium"
                      color="gray.600"
                      mb={1}
                    >
                      채널 라벨 *
                    </Text>
                    <Input
                      size="sm"
                      value={channelLabel}
                      onChange={(e) => setChannelLabel(e.target.value)}
                      placeholder={`${typeName || "type-name"}_data_channel`}
                      required
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      WebRTC 데이터 채널의 라벨입니다. 고유한 이름을
                      입력해주세요.
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
                          ? "✓ 유효한 JSON Schema입니다"
                          : "✗ 유효하지 않은 JSON Schema입니다"}
                      </Text>
                    )}
                  </Box>

                  {/* 저장 버튼 */}
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={saveType}
                    loading={isLoading}
                    disabled={!isValid || !typeName.trim()}
                    w="100%"
                  >
                    {isLoading ? "저장 중..." : editingConfig ? "수정" : "등록"}
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
