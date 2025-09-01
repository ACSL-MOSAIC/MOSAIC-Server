import {
  Box,
  Button,
  Field,
  Fieldset,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
// Simple icon components
const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
)
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
import { ReadOnlyStoreManager } from "@/dashboard/store/data-channel-store/readonly/read-only-store-manager.ts"
import type {
  ChartAxisConfig,
  ChartConfig,
  DataSourceConfig,
  UniversalWidgetConfig,
  VisualizationConfig,
  VisualizationType,
} from "./universal-widget-config"

function getFieldPathsFromSample(
  obj: any,
  prefix = "",
): { path: string; type: string }[] {
  if (typeof obj !== "object" || obj === null) return []
  let paths: { path: string; type: string }[] = []
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue
    const value = obj[key]
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        // For arrays, use only the first element as example
        if (value.length > 0 && typeof value[0] === "object") {
          paths = paths.concat(getFieldPathsFromSample(value[0], `${path}[0]`))
        } else {
          // Infer array type
          const arrType = value.length > 0 ? typeof value[0] : "any"
          paths.push({ path: `${path}[0]`, type: arrType })
        }
      } else {
        paths = paths.concat(getFieldPathsFromSample(value, path))
      }
    } else {
      paths.push({ path, type: typeof value })
    }
  }
  return paths
}

interface UniversalWidgetConfiguratorProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (config: UniversalWidgetConfig) => void
  robotId: string
  initialConfig?: UniversalWidgetConfig
}

export function UniversalWidgetConfigurator({
  isOpen,
  onClose,
  onComplete,
  robotId,
  initialConfig,
}: UniversalWidgetConfiguratorProps) {
  const [config, setConfig] = useState<UniversalWidgetConfig>(
    initialConfig || {
      id: `universal_${Date.now()}`,
      title: "Universal Widget",
      dataSources: [],
      visualizations: [],
      layout: "grid",
    },
  )

  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance()
  const robotStores = readOnlyStoreManager.getReadOnlyStores(robotId)
  const connectedStores =
    readOnlyStoreManager.getConnectedReadOnlyStores(robotId)

  // Create array containing store information (symbol -> data type mapping)
  const storeInfo = Array.from(robotStores.entries()).map(([symbol, store]) => {
    const symbolStr = symbol.toString()
    // Extract data type from symbol (e.g., Symbol(go2_low_state) -> go2_low_state)
    const dataType = symbolStr.replace(/^Symbol\((.+)\)$/, "$1")
    const isConnected = connectedStores.includes(store)

    return {
      symbol,
      store,
      dataType,
      isConnected,
      storeName: store.constructor.name,
      lastData: store.getLast?.() || null,
    }
  })

  // Filter only connected stores (optional)
  const availableStores = storeInfo.filter((info) => info.isConnected)

  // Add data source
  const addDataSource = () => {
    if (availableStores.length === 0) return

    const newDataSource: DataSourceConfig = {
      robotId,
      dataType: availableStores[0].dataType,
    }

    setConfig((prev) => ({
      ...prev,
      dataSources: [...prev.dataSources, newDataSource],
    }))
  }

  // Remove data source
  const removeDataSource = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      dataSources: prev.dataSources.filter((_, i) => i !== index),
      visualizations: prev.visualizations.filter(
        (v) => v.dataSourceIndex !== index,
      ),
    }))
  }

  // Update data source
  const updateDataSource = (index: number, dataType: string) => {
    setConfig((prev) => ({
      ...prev,
      dataSources: prev.dataSources.map((ds, i) =>
        i === index ? { ...ds, dataType } : ds,
      ),
    }))
  }

  // Add visualization
  const addVisualization = (dataSourceIndex: number) => {
    const dataSource = config.dataSources[dataSourceIndex]
    if (!dataSource) return

    const newVisualization: VisualizationConfig = {
      id: `viz_${Date.now()}`,
      type: "number",
      title: "New Visualization",
      dataSourceIndex,
      dataMapping: {
        fieldPath: "",
      },
    }

    setConfig((prev) => ({
      ...prev,
      visualizations: [...prev.visualizations, newVisualization],
    }))
  }

  // Remove visualization
  const removeVisualization = (visualizationId: string) => {
    setConfig((prev) => ({
      ...prev,
      visualizations: prev.visualizations.filter(
        (v) => v.id !== visualizationId,
      ),
    }))
  }

  // Update visualization
  const updateVisualization = (
    visualizationId: string,
    updates: Partial<VisualizationConfig>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      visualizations: prev.visualizations.map((v) =>
        v.id === visualizationId ? { ...v, ...updates } : v,
      ),
    }))
  }

  // Save configuration
  const handleSave = () => {
    if (config.title.trim() === "") {
      alert("Please enter a widget title.")
      return
    }

    if (config.dataSources.length === 0) {
      alert("Please add at least one data source.")
      return
    }

    if (config.visualizations.length === 0) {
      alert("Please add at least one visualization.")
      return
    }

    // Clean up fieldPath types
    const newConfig = {
      ...config,
      visualizations: config.visualizations.map((viz) => ({
        ...viz,
        dataMapping: {
          ...viz.dataMapping,
          fieldPath:
            viz.type === "json"
              ? Array.isArray(viz.dataMapping.fieldPath)
                ? viz.dataMapping.fieldPath
                : [viz.dataMapping.fieldPath].filter(Boolean)
              : Array.isArray(viz.dataMapping.fieldPath)
                ? viz.dataMapping.fieldPath[0] || ""
                : viz.dataMapping.fieldPath,
        },
      })),
    }
    onComplete(newConfig)
    onClose()
  }

  // State for automatic field path extraction
  const [fieldPathOptions, setFieldPathOptions] = useState<
    { path: string; type: string }[]
  >([])

  // Auto-extract field paths when data type changes
  useEffect(() => {
    if (config.dataSources.length === 0) return
    const dataSource = config.dataSources[config.dataSources.length - 1]

    // Find store of corresponding data type from store information
    const selectedStoreInfo = availableStores.find(
      (info) => info.dataType === dataSource.dataType,
    )

    if (selectedStoreInfo?.lastData) {
      const paths = getFieldPathsFromSample(selectedStoreInfo.lastData)
      setFieldPathOptions(paths)
    } else {
      setFieldPathOptions([])
    }
  }, [config.dataSources, availableStores])

  // Filter field path options based on visualization type
  const getFilteredFieldPathOptions = (vizType: string) => {
    switch (vizType) {
      case "number":
      case "gauge":
      case "lineChart":
        return fieldPathOptions.filter((opt) => opt.type === "number")
      case "text":
        return fieldPathOptions.filter((opt) =>
          ["string", "number", "boolean"].includes(opt.type),
        )
      default:
        return fieldPathOptions
    }
  }

  // Ensure default values for yAxes, xAxis
  const getYAxisArray = (
    chartConfig: ChartConfig | undefined,
    fallbackField: string,
  ): ChartAxisConfig[] => {
    if (
      chartConfig &&
      Array.isArray(chartConfig.yAxes) &&
      chartConfig.yAxes.length > 0
    )
      return chartConfig.yAxes
    return [{ fieldPath: fallbackField }]
  }
  const getXAxis = (chartConfig: ChartConfig | undefined): ChartAxisConfig => {
    if (chartConfig?.xAxis) return chartConfig.xAxis
    return { fieldPath: "timestamp" }
  }

  // Always ensure default values for xAxis, yAxes when updating chartConfig
  const updateChartConfig = (
    oldConfig: ChartConfig | undefined,
    updates: Partial<ChartConfig>,
    fallbackField: string,
  ): ChartConfig => {
    return {
      xAxis: oldConfig?.xAxis || { fieldPath: "timestamp" },
      yAxes:
        oldConfig?.yAxes && oldConfig.yAxes.length > 0
          ? oldConfig.yAxes
          : [{ fieldPath: fallbackField }],
      chartType: updates.chartType || oldConfig?.chartType || "line",
      ...oldConfig,
      ...updates,
    }
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "lg" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
    >
      <DialogContent
        style={{
          overflow: "visible",
          position: "relative",
          zIndex: 1000,
        }}
      >
        <DialogCloseTrigger />
        <DialogHeader>
          <DialogTitle>
            {initialConfig
              ? "Edit Universal Widget"
              : "Create Universal Widget"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="stretch">
            {/* Basic Settings */}
            <Fieldset.Root
              mb={4}
              style={{
                background: "#f8fafc",
                borderRadius: 8,
                padding: 16,
                border: "1px solid #e2e8f0",
              }}
            >
              <Fieldset.Content>
                <Field.Root>
                  <Field.Label>Widget Title</Field.Label>
                  <Input
                    value={config.title}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter widget title"
                  />
                </Field.Root>

                <Field.Root mt={3}>
                  <Field.Label>Layout</Field.Label>
                  <select
                    value={config.layout}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        layout: e.target.value as any,
                      }))
                    }
                    style={{
                      padding: "8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      width: "100%",
                    }}
                  >
                    <option value="grid">Grid</option>
                    <option value="vertical">Vertical</option>
                    <option value="horizontal">Horizontal</option>
                  </select>
                </Field.Root>
              </Fieldset.Content>
            </Fieldset.Root>
            <Box as="hr" my={2} borderColor="#e2e8f0" />
            {/* Data Source Settings */}
            <Fieldset.Root
              mb={4}
              style={{
                background: "#f8fafc",
                borderRadius: 8,
                padding: 16,
                border: "1px solid #e2e8f0",
              }}
            >
              <Fieldset.Legend>
                <Text fontWeight="bold" fontSize="md">
                  Data Sources
                </Text>
              </Fieldset.Legend>
              <Fieldset.Content>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold">Data Sources</Text>
                  <Button
                    size="sm"
                    onClick={addDataSource}
                    disabled={availableStores.length === 0}
                  >
                    <AddIcon />
                    Add Data Source
                  </Button>
                </HStack>

                {availableStores.length === 0 ? (
                  <Box
                    p={4}
                    textAlign="center"
                    color="gray.500"
                    bg="#fff"
                    borderRadius="md"
                    border="1px solid #e2e8f0"
                  >
                    <Text fontSize="sm">No connected stores available.</Text>
                    <Text fontSize="xs" mt={1}>
                      Stores will be available after connecting to a robot.
                    </Text>
                  </Box>
                ) : (
                  config.dataSources.map((dataSource, index) => (
                    <Box
                      key={index}
                      p={3}
                      border="1px solid #e2e8f0"
                      borderRadius="md"
                      mb={2}
                      bg="#fff"
                      display="flex"
                      flexDirection="column"
                      gap={2}
                    >
                      <HStack
                        justify="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Text fontSize="sm" fontWeight="bold">
                          Data Source {index + 1}
                        </Text>
                        <IconButton
                          aria-label="Remove Data Source"
                          size="xs"
                          variant="ghost"
                          onClick={() => removeDataSource(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </HStack>

                      <Field.Root>
                        <Field.Label fontSize="sm">Select Store</Field.Label>
                        <select
                          value={dataSource.dataType}
                          onChange={(e) =>
                            updateDataSource(index, e.target.value)
                          }
                          style={{
                            padding: "8px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            width: "100%",
                            fontSize: "14px",
                          }}
                        >
                          {availableStores.map((storeInfo) => (
                            <option
                              key={storeInfo.dataType}
                              value={storeInfo.dataType}
                            >
                              {storeInfo.storeName} ({storeInfo.dataType}) -{" "}
                              {storeInfo.isConnected ? "Connected" : "Disconnected"}
                            </option>
                          ))}
                        </select>
                      </Field.Root>

                      {/* Sample data preview for selected store */}
                      {(() => {
                        const selectedStoreInfo = availableStores.find(
                          (info) => info.dataType === dataSource.dataType,
                        )
                        if (selectedStoreInfo?.lastData) {
                          return (
                            <Field.Root>
                              <Field.Label fontSize="sm">
                                Sample Data
                              </Field.Label>
                              <Box
                                p={2}
                                bg="#f7fafc"
                                borderRadius="md"
                                fontSize="xs"
                                fontFamily="monospace"
                                maxH="100px"
                                overflow="auto"
                                border="1px solid #e2e8f0"
                              >
                                <pre>
                                  {JSON.stringify(
                                    selectedStoreInfo.lastData,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </Box>
                            </Field.Root>
                          )
                        }
                        return null
                      })()}
                    </Box>
                  ))
                )}
              </Fieldset.Content>
            </Fieldset.Root>
            <Box as="hr" my={2} borderColor="#e2e8f0" />
            {/* Visualization Settings */}
            <Fieldset.Root
              mb={4}
              style={{
                background: "#f8fafc",
                borderRadius: 8,
                padding: 16,
                border: "1px solid #e2e8f0",
              }}
            >
              <Fieldset.Legend>
                <Text fontWeight="bold" fontSize="md">
                  Visualizations
                </Text>
              </Fieldset.Legend>
              <Fieldset.Content>
                {config.dataSources.map((dataSource, dataSourceIndex) => (
                  <Box key={dataSourceIndex} mb={4}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="bold">
                        {dataSource.dataType} Visualizations
                      </Text>
                      <Button
                        size="sm"
                        onClick={() => addVisualization(dataSourceIndex)}
                      >
                        <AddIcon />
                        Add Visualization
                      </Button>
                    </HStack>

                    {config.visualizations
                      .filter((v) => v.dataSourceIndex === dataSourceIndex)
                      .map((visualization) => (
                        <Box
                          key={visualization.id}
                          p={3}
                          border="1px solid #e2e8f0"
                          borderRadius="md"
                          mb={2}
                          bg="#fff"
                          display="flex"
                          flexDirection="column"
                          gap={2}
                        >
                          <HStack
                            justify="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            <Text fontSize="sm" fontWeight="bold">
                              Visualization: {visualization.title}
                            </Text>
                            <IconButton
                              aria-label="Remove Visualization"
                              size="xs"
                              variant="ghost"
                              onClick={() =>
                                removeVisualization(visualization.id)
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </HStack>

                          <VStack gap={2} align="stretch">
                            <Field.Root>
                              <Field.Label>Title</Field.Label>
                              <Input
                                size="sm"
                                value={visualization.title}
                                onChange={(e) =>
                                  updateVisualization(visualization.id, {
                                    title: e.target.value,
                                  })
                                }
                              />
                            </Field.Root>

                            <Field.Root>
                              <Field.Label>Visualization Type</Field.Label>
                              <select
                                value={visualization.type}
                                onChange={(e) =>
                                  updateVisualization(visualization.id, {
                                    type: e.target.value as VisualizationType,
                                  })
                                }
                                style={{
                                  padding: "8px",
                                  border: "1px solid #d1d5db",
                                  borderRadius: "6px",
                                  width: "100%",
                                  fontSize: "14px",
                                }}
                              >
                                <option value="chart">Chart</option>
                                <option value="number">Number</option>
                                <option value="gauge">Gauge</option>
                                <option value="text">Text</option>
                                <option value="json">JSON</option>
                              </select>
                            </Field.Root>
                            {/* Chart 내부 타입 선택 UI */}
                            {visualization.type === "chart" && (
                              <Field.Root>
                                <Field.Label fontSize="sm">
                                  Chart Type
                                </Field.Label>
                                <select
                                  value={
                                    visualization.chartConfig?.chartType ??
                                    "line"
                                  }
                                  onChange={(e) =>
                                    updateVisualization(visualization.id, {
                                      chartConfig: updateChartConfig(
                                        visualization.chartConfig,
                                        { chartType: e.target.value as any },
                                        visualization.dataMapping.fieldPath,
                                      ),
                                    })
                                  }
                                  style={{
                                    padding: "8px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "6px",
                                    width: "100%",
                                    fontSize: "14px",
                                  }}
                                >
                                  <option value="line">Line Chart</option>
                                  <option value="bar">Bar Chart</option>
                                  <option value="scatter">Scatter Chart</option>
                                  <option value="area">Area Chart</option>
                                </select>
                              </Field.Root>
                            )}

                            <Field.Root>
                              <Field.Label>Data Field Path</Field.Label>
                              <Box
                                display="flex"
                                flexDirection="column"
                                gap={2}
                              >
                                {visualization.type === "json" ? (
                                  <>
                                    {(Array.isArray(
                                      visualization.dataMapping.fieldPath,
                                    )
                                      ? visualization.dataMapping.fieldPath
                                      : [
                                          visualization.dataMapping.fieldPath,
                                        ].filter(Boolean)
                                    ).map((field, idx, arr) => (
                                      <Box
                                        key={idx}
                                        display="flex"
                                        gap={2}
                                        alignItems="center"
                                        mb={1}
                                      >
                                        <Input
                                          size="sm"
                                          value={field}
                                          onChange={(e) => {
                                            const newFields = [...arr]
                                            newFields[idx] = e.target.value
                                            updateVisualization(
                                              visualization.id,
                                              {
                                                dataMapping: {
                                                  ...visualization.dataMapping,
                                                  fieldPath: newFields,
                                                },
                                              },
                                            )
                                          }}
                                          placeholder="Field path"
                                          flex="1"
                                        />
                                        {getFilteredFieldPathOptions(
                                          visualization.type,
                                        ).length > 0 && (
                                          <select
                                            value={field}
                                            onChange={(e) => {
                                              const newFields = [...arr]
                                              newFields[idx] = e.target.value
                                              updateVisualization(
                                                visualization.id,
                                                {
                                                  dataMapping: {
                                                    ...visualization.dataMapping,
                                                    fieldPath: newFields,
                                                  },
                                                },
                                              )
                                            }}
                                            style={{ minWidth: 120 }}
                                          >
                                            <option value="">
                                              Select field
                                            </option>
                                            {getFilteredFieldPathOptions(
                                              visualization.type,
                                            ).map((opt) => (
                                              <option
                                                key={opt.path}
                                                value={opt.path}
                                              >
                                                {opt.path} ({opt.type})
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                        {arr.length > 1 && (
                                          <Button
                                            size="xs"
                                            colorScheme="red"
                                            variant="ghost"
                                            onClick={() => {
                                              const newFields = arr.filter(
                                                (_, i) => i !== idx,
                                              )
                                              updateVisualization(
                                                visualization.id,
                                                {
                                                  dataMapping: {
                                                    ...visualization.dataMapping,
                                                    fieldPath: newFields,
                                                  },
                                                },
                                              )
                                            }}
                                          >
                                            -
                                          </Button>
                                        )}
                                      </Box>
                                    ))}
                                    <Button
                                      size="xs"
                                      colorScheme="blue"
                                      variant="outline"
                                      mt={1}
                                      onClick={() => {
                                        const arr = Array.isArray(
                                          visualization.dataMapping.fieldPath,
                                        )
                                          ? visualization.dataMapping.fieldPath
                                          : [
                                              visualization.dataMapping
                                                .fieldPath,
                                            ].filter(Boolean)
                                        updateVisualization(visualization.id, {
                                          dataMapping: {
                                            ...visualization.dataMapping,
                                            fieldPath: [...arr, ""],
                                          },
                                        })
                                      }}
                                    >
                                      + Add Field
                                    </Button>
                                  </>
                                ) : (
                                  <Box
                                    display="flex"
                                    gap={2}
                                    alignItems="center"
                                  >
                                    <Input
                                      size="sm"
                                      value={
                                        Array.isArray(
                                          visualization.dataMapping.fieldPath,
                                        )
                                          ? visualization.dataMapping
                                              .fieldPath[0] || ""
                                          : visualization.dataMapping.fieldPath
                                      }
                                      onChange={(e) =>
                                        updateVisualization(visualization.id, {
                                          dataMapping: {
                                            ...visualization.dataMapping,
                                            fieldPath: e.target.value,
                                          },
                                        })
                                      }
                                      placeholder="e.g.: motor_state[0].q, power_v"
                                      flex="1"
                                    />
                                    {getFilteredFieldPathOptions(
                                      visualization.type,
                                    ).length > 0 && (
                                      <select
                                        value={
                                          Array.isArray(
                                            visualization.dataMapping.fieldPath,
                                          )
                                            ? visualization.dataMapping
                                                .fieldPath[0] || ""
                                            : visualization.dataMapping
                                                .fieldPath
                                        }
                                        onChange={(e) =>
                                          updateVisualization(
                                            visualization.id,
                                            {
                                              dataMapping: {
                                                ...visualization.dataMapping,
                                                fieldPath: e.target.value,
                                              },
                                            },
                                          )
                                        }
                                        style={{ minWidth: 120 }}
                                      >
                                        <option value="">Select Field</option>
                                        {getFilteredFieldPathOptions(
                                          visualization.type,
                                        ).map((opt) => (
                                          <option
                                            key={opt.path}
                                            value={opt.path}
                                          >
                                            {opt.path} ({opt.type})
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            </Field.Root>

                            <Field.Root>
                              <Field.Label>Label</Field.Label>
                              <Input
                                size="sm"
                                value={visualization.dataMapping.label || ""}
                                onChange={(e) =>
                                  updateVisualization(visualization.id, {
                                    dataMapping: {
                                      ...visualization.dataMapping,
                                      label: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Label to display"
                              />
                            </Field.Root>

                            <Field.Root>
                              <Field.Label>Unit</Field.Label>
                              <Input
                                size="sm"
                                value={visualization.dataMapping.unit || ""}
                                onChange={(e) =>
                                  updateVisualization(visualization.id, {
                                    dataMapping: {
                                      ...visualization.dataMapping,
                                      unit: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g.: V, A, rad/s"
                              />
                            </Field.Root>

                            {/* Chart-specific settings */}
                            {(visualization.type === "lineChart" ||
                              visualization.type === "barChart" ||
                              visualization.type === "scatterChart" ||
                              visualization.type === "areaChart") && (
                              <>
                                <Field.Root>
                                  <Field.Label fontSize="sm">
                                    X Axis Field
                                  </Field.Label>
                                  <select
                                    value={
                                      visualization.chartConfig?.xAxis
                                        ?.fieldPath || "timestamp"
                                    }
                                    onChange={(e) =>
                                      updateVisualization(visualization.id, {
                                        chartConfig: updateChartConfig(
                                          visualization.chartConfig,
                                          {
                                            xAxis: {
                                              fieldPath: e.target.value,
                                            },
                                          },
                                          visualization.dataMapping.fieldPath,
                                        ),
                                      })
                                    }
                                    style={{
                                      padding: "8px",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "6px",
                                      width: "100%",
                                      fontSize: "14px",
                                    }}
                                  >
                                    <option value="timestamp">timestamp</option>
                                    {fieldPathOptions.map((opt) => (
                                      <option key={opt.path} value={opt.path}>
                                        {opt.path} ({opt.type})
                                      </option>
                                    ))}
                                  </select>
                                </Field.Root>
                                <Field.Root>
                                  <Field.Label fontSize="sm">
                                    Y Axes
                                  </Field.Label>
                                  <VStack gap={2} align="stretch">
                                    {getYAxisArray(
                                      visualization.chartConfig,
                                      visualization.dataMapping.fieldPath,
                                    ).map(
                                      (
                                        yAxis: ChartAxisConfig,
                                        yIdx: number,
                                        arr: ChartAxisConfig[],
                                      ) => (
                                        <Box
                                          key={yIdx}
                                          display="flex"
                                          gap={2}
                                          alignItems="center"
                                          border="1px solid #e2e8f0"
                                          borderRadius="md"
                                          p={2}
                                          bg="#fff"
                                        >
                                          <select
                                            value={
                                              typeof yAxis.fieldPath ===
                                              "string"
                                                ? yAxis.fieldPath
                                                : ""
                                            }
                                            onChange={(e) => {
                                              const newYAxes = [
                                                ...getYAxisArray(
                                                  visualization.chartConfig,
                                                  visualization.dataMapping
                                                    .fieldPath,
                                                ),
                                              ]
                                              newYAxes[yIdx] = {
                                                ...newYAxes[yIdx],
                                                fieldPath: e.target.value,
                                              }
                                              updateVisualization(
                                                visualization.id,
                                                {
                                                  chartConfig:
                                                    updateChartConfig(
                                                      visualization.chartConfig,
                                                      { yAxes: newYAxes },
                                                      visualization.dataMapping
                                                        .fieldPath,
                                                    ),
                                                },
                                              )
                                            }}
                                            style={{ minWidth: 120 }}
                                          >
                                            <option value="">
                                              Select field
                                            </option>
                                            {fieldPathOptions
                                              .filter(
                                                (opt) => opt.type === "number",
                                              )
                                              .map((opt) => (
                                                <option
                                                  key={String(opt.path)}
                                                  value={
                                                    typeof opt.path === "string"
                                                      ? opt.path
                                                      : ""
                                                  }
                                                >
                                                  {typeof opt.path === "string"
                                                    ? opt.path
                                                    : ""}{" "}
                                                  ({opt.type})
                                                </option>
                                              ))}
                                          </select>
                                          <Input
                                            size="sm"
                                            value={
                                              typeof yAxis.label === "string"
                                                ? yAxis.label
                                                : ""
                                            }
                                            onChange={(e) => {
                                              const newYAxes = [
                                                ...getYAxisArray(
                                                  visualization.chartConfig,
                                                  visualization.dataMapping
                                                    .fieldPath,
                                                ),
                                              ]
                                              newYAxes[yIdx] = {
                                                ...newYAxes[yIdx],
                                                label: e.target.value,
                                              }
                                              updateVisualization(
                                                visualization.id,
                                                {
                                                  chartConfig:
                                                    updateChartConfig(
                                                      visualization.chartConfig,
                                                      { yAxes: newYAxes },
                                                      visualization.dataMapping
                                                        .fieldPath,
                                                    ),
                                                },
                                              )
                                            }}
                                          />
                                          <Input
                                            size="sm"
                                            value={
                                              typeof yAxis.color === "string"
                                                ? yAxis.color
                                                : ""
                                            }
                                            onChange={(e) => {
                                              const newYAxes = [
                                                ...getYAxisArray(
                                                  visualization.chartConfig,
                                                  visualization.dataMapping
                                                    .fieldPath,
                                                ),
                                              ]
                                              newYAxes[yIdx] = {
                                                ...newYAxes[yIdx],
                                                color: e.target.value,
                                              }
                                              updateVisualization(
                                                visualization.id,
                                                {
                                                  chartConfig:
                                                    updateChartConfig(
                                                      visualization.chartConfig,
                                                      { yAxes: newYAxes },
                                                      visualization.dataMapping
                                                        .fieldPath,
                                                    ),
                                                },
                                              )
                                            }}
                                          />
                                          <Input
                                            size="sm"
                                            value={
                                              typeof yAxis.unit === "string"
                                                ? yAxis.unit
                                                : ""
                                            }
                                            onChange={(e) => {
                                              const newYAxes = [
                                                ...getYAxisArray(
                                                  visualization.chartConfig,
                                                  visualization.dataMapping
                                                    .fieldPath,
                                                ),
                                              ]
                                              newYAxes[yIdx] = {
                                                ...newYAxes[yIdx],
                                                unit: e.target.value,
                                              }
                                              updateVisualization(
                                                visualization.id,
                                                {
                                                  chartConfig:
                                                    updateChartConfig(
                                                      visualization.chartConfig,
                                                      { yAxes: newYAxes },
                                                      visualization.dataMapping
                                                        .fieldPath,
                                                    ),
                                                },
                                              )
                                            }}
                                          />
                                          {arr.length > 1 && (
                                            <Button
                                              size="xs"
                                              colorScheme="red"
                                              variant="ghost"
                                              onClick={() => {
                                                const newYAxes = arr.filter(
                                                  (_, i) => i !== yIdx,
                                                )
                                                updateVisualization(
                                                  visualization.id,
                                                  {
                                                    chartConfig:
                                                      updateChartConfig(
                                                        visualization.chartConfig,
                                                        { yAxes: newYAxes },
                                                        visualization
                                                          .dataMapping
                                                          .fieldPath,
                                                      ),
                                                  },
                                                )
                                              }}
                                            >
                                              -
                                            </Button>
                                          )}
                                        </Box>
                                      ),
                                    )}
                                    <Button
                                      size="xs"
                                      colorScheme="blue"
                                      variant="outline"
                                      mt={1}
                                      onClick={() => {
                                        const yAxes = getYAxisArray(
                                          visualization.chartConfig,
                                          visualization.dataMapping.fieldPath,
                                        )
                                        updateVisualization(visualization.id, {
                                          chartConfig: updateChartConfig(
                                            visualization.chartConfig,
                                            {
                                              yAxes: [
                                                ...yAxes,
                                                { fieldPath: "" },
                                              ],
                                              xAxis: getXAxis(
                                                visualization.chartConfig,
                                              ),
                                            },
                                            visualization.dataMapping.fieldPath,
                                          ),
                                        })
                                      }}
                                    >
                                      + Add Y Axis
                                    </Button>
                                  </VStack>
                                </Field.Root>
                                <Field.Root>
                                  <Field.Label fontSize="sm">
                                    Chart Type
                                  </Field.Label>
                                  <select
                                    value={
                                      visualization.chartConfig?.chartType ??
                                      "line"
                                    }
                                    onChange={(e) =>
                                      updateVisualization(visualization.id, {
                                        chartConfig: updateChartConfig(
                                          visualization.chartConfig,
                                          { chartType: e.target.value as any },
                                          visualization.dataMapping.fieldPath,
                                        ),
                                      })
                                    }
                                    style={{
                                      padding: "8px",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "6px",
                                      width: "100%",
                                      fontSize: "14px",
                                    }}
                                  >
                                    <option value="line">Line Chart</option>
                                    <option value="bar">Bar Chart</option>
                                    <option value="scatter">
                                      Scatter Chart
                                    </option>
                                    <option value="area">Area Chart</option>
                                  </select>
                                </Field.Root>
                              </>
                            )}

                            {/* Gauge-specific settings */}
                            {visualization.type === "gauge" && (
                              <>
                                <Field.Root>
                                  <Field.Label fontSize="sm">
                                    Minimum Value
                                  </Field.Label>
                                  <Input
                                    size="sm"
                                    type="number"
                                    value={visualization.gaugeConfig?.min || 0}
                                    onChange={(e) =>
                                      updateVisualization(visualization.id, {
                                        gaugeConfig: {
                                          ...visualization.gaugeConfig,
                                          min:
                                            Number.parseFloat(e.target.value) ||
                                            0,
                                        },
                                      })
                                    }
                                    placeholder="0"
                                  />
                                </Field.Root>

                                <Field.Root>
                                  <Field.Label fontSize="sm">
                                    Maximum Value
                                  </Field.Label>
                                  <Input
                                    size="sm"
                                    type="number"
                                    value={
                                      visualization.gaugeConfig?.max || 100
                                    }
                                    onChange={(e) =>
                                      updateVisualization(visualization.id, {
                                        gaugeConfig: {
                                          ...visualization.gaugeConfig,
                                          max:
                                            Number.parseFloat(e.target.value) ||
                                            100,
                                        },
                                      })
                                    }
                                    placeholder="100"
                                  />
                                </Field.Root>

                                <Field.Root>
                                  <Field.Label fontSize="sm">
                                    Gauge Size
                                  </Field.Label>
                                  <select
                                    value={
                                      visualization.gaugeConfig?.size ||
                                      "medium"
                                    }
                                    onChange={(e) =>
                                      updateVisualization(visualization.id, {
                                        gaugeConfig: {
                                          ...visualization.gaugeConfig,
                                          size: e.target.value as any,
                                        },
                                      })
                                    }
                                    style={{
                                      padding: "8px",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "6px",
                                      width: "100%",
                                      fontSize: "14px",
                                    }}
                                  >
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                  </select>
                                </Field.Root>
                              </>
                            )}
                          </VStack>
                        </Box>
                      ))}
                  </Box>
                ))}
              </Fieldset.Content>
            </Fieldset.Root>
          </VStack>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="subtle" colorPalette="gray" onClick={onClose}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button variant="solid" colorPalette="blue" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
