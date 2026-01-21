import { ReadOnlyStoreManager } from "@/dashboard/store/data-channel-store/readonly/read-only-store-manager.ts"
import {
  Box,
  Flex,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Bar, Line, Scatter } from "react-chartjs-2"
import { FiSettings } from "react-icons/fi"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { WidgetFrame } from "../WidgetFrame"
import { UniversalWidgetConfigurator } from "./UniversalWidgetConfigurator"
import type {
  UniversalWidgetConfig,
  VisualizationConfig,
} from "./universal-widget-config"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

interface UniversalWidgetProps {
  robotId: string
  config: UniversalWidgetConfig
  connections?: { [key: string]: boolean }
  onUpdateConfig?: (newConfig: UniversalWidgetConfig) => void
  onRemove?: () => void
  widgetId?: string
}

// 중첩된 객체에서 값을 가져오는 유틸리티 함수
const getNestedValue = (obj: any, path: string): any => {
  if (!path) return obj // 경로가 빈 문자열이면 전체 객체 반환
  return path.split(".").reduce((current, key) => {
    if (current === null || current === undefined) return null

    // 배열 인덱스 처리 (예: "motor_state[0].q")
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/)
    if (arrayMatch) {
      const arrayKey = arrayMatch[1]
      const index = Number.parseInt(arrayMatch[2])
      return current[arrayKey]?.[index]
    }

    return current[key]
  }, obj)
}

// 개선된 차트 시각화 컴포넌트
const EnhancedChartVisualization: React.FC<{
  config: VisualizationConfig
  data: any[]
  maxDataPoints?: number
}> = ({ config, data, maxDataPoints = 100 }) => {
  const chartConfig = config.chartConfig || {
    xAxis: { fieldPath: "timestamp", label: "Time" },
    yAxes: [
      {
        fieldPath: config.dataMapping.fieldPath,
        label: config.dataMapping.label || "Value",
        color: config.dataMapping.color || "#3182ce",
      },
    ],
    chartType: "line",
    showLegend: true,
    showGrid: true,
    animation: true,
    tension: 0.1,
    pointRadius: 3,
    borderWidth: 2,
  }

  const chartData = useMemo(() => {
    const recentData = data.slice(-maxDataPoints)

    // X축 데이터 준비
    const xValues = recentData.map((item) => {
      const xValue = getNestedValue(item, chartConfig.xAxis.fieldPath)
      if (chartConfig.xAxis.fieldPath === "timestamp") {
        return new Date(xValue).toLocaleTimeString() // 시간을 문자열로 표시
      }
      return xValue
    })

    // Y축 데이터셋들 준비
    const datasets = chartConfig.yAxes.map((yAxis, _) => {
      const values = recentData.map((item) => {
        const value = getNestedValue(item, yAxis.fieldPath)
        return typeof value === "number" ? value : 0
      })

      const baseColor = yAxis.color || config.dataMapping.color || "#3182ce"
      const backgroundColor =
        chartConfig.chartType === "area"
          ? `${baseColor}40` // 투명도 추가
          : baseColor

      return {
        label: yAxis.label || yAxis.fieldPath,
        data: values,
        borderColor: baseColor,
        backgroundColor: backgroundColor,
        tension: chartConfig.tension || 0.1,
        pointRadius: chartConfig.pointRadius || 3,
        borderWidth: chartConfig.borderWidth || 2,
        fill: chartConfig.chartType === "area",
        pointBackgroundColor: baseColor,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: baseColor,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      }
    })

    return {
      labels: xValues,
      datasets,
    }
  }, [data, chartConfig, maxDataPoints])

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: chartConfig.animation ? 750 : 0,
        easing: "easeInOutQuart" as const,
      },
      plugins: {
        legend: {
          display: chartConfig.showLegend !== false,
          position: "top" as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#fff",
          bodyColor: "#fff",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales: {
        x: {
          type: "category" as const,
          display: true,
          grid: {
            display: chartConfig.showGrid !== false,
            color: "rgba(0, 0, 0, 0.1)",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: { size: 11 },
            maxTicksLimit: 8,
          },
        },
        y: {
          display: true,
          grid: {
            display: chartConfig.showGrid !== false,
            color: "rgba(0, 0, 0, 0.1)",
            drawBorder: false,
          },
          ticks: {
            color: "#666",
            font: { size: 11 },
          },
          beginAtZero: true,
        },
      },
      interaction: {
        mode: "nearest" as const,
        axis: "x" as const,
        intersect: false,
      },
      elements: {
        point: {
          hoverRadius: 8,
        },
      },
    }
  }, [chartConfig])

  const renderChart = () => {
    switch (chartConfig.chartType) {
      case "bar":
        return <Bar data={chartData} options={chartOptions} height={200} />
      case "scatter":
        return <Scatter data={chartData} options={chartOptions} height={200} />
      default:
        return <Line data={chartData} options={chartOptions} height={200} />
    }
  }

  return (
    <Box
      p={4}
      h="100%"
      display="flex"
      flexDirection="column"
      borderRadius="lg"
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      border="1px solid"
      borderColor="gray.200"
      bg="white"
      _hover={{
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      transition="all 0.2s"
    >
      <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.800">
        {config.title}
      </Text>
      <Box flex="1" position="relative">
        {renderChart()}
      </Box>
    </Box>
  )
}

import GaugeChart from "react-gauge-chart"

// 개선된 게이지 시각화 컴포넌트
const EnhancedGaugeVisualization: React.FC<{
  config: VisualizationConfig
  data: any
}> = ({ config, data }) => {
  const value = getNestedValue(data, config.dataMapping.fieldPath)
  const numericValue = typeof value === "number" ? value : 0

  const gaugeConfig = config.gaugeConfig || {
    min: 0,
    max: 100,
    thresholds: { warning: 70, critical: 90 },
    colors: { low: "#10b981", medium: "#f59e0b", high: "#ef4444" },
    showValue: true,
    showUnit: true,
    animation: true,
    size: "medium",
  }

  const normalizedValue = Math.max(
    gaugeConfig.min || 0,
    Math.min(gaugeConfig.max || 100, numericValue),
  )
  const percentage =
    (normalizedValue - (gaugeConfig.min || 0)) / (gaugeConfig.max || 100) -
    (gaugeConfig.min || 0)

  // 색상 결정
  const getGaugeColors = () => {
    const lowColor = gaugeConfig.colors?.low || "#10b981"
    const mediumColor = gaugeConfig.colors?.medium || "#f59e0b"
    const highColor = gaugeConfig.colors?.high || "#ef4444"

    return [lowColor, mediumColor, highColor]
  }

  // 크기 설정
  const sizeMap = {
    small: { width: 200, height: 200 },
    medium: { width: 250, height: 250 },
    large: { width: 300, height: 300 },
  }

  const size = sizeMap[gaugeConfig.size || "medium"]

  return (
    <Box
      p={4}
      h="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      borderRadius="lg"
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      border="1px solid"
      borderColor="gray.200"
      bg="white"
      _hover={{
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      transition="all 0.2s"
    >
      <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
        {config.title}
      </Text>

      <Box
        width={size.width}
        height={size.height}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <GaugeChart
          id={`gauge-${config.id}`}
          nrOfLevels={3}
          colors={getGaugeColors()}
          percent={percentage}
          arcWidth={0.3}
          textColor="#464A4F"
          needleColor="#345243"
          needleBaseColor="#345243"
          hideText={!gaugeConfig.showValue}
          animate={gaugeConfig.animation}
          formatTextValue={() =>
            `${normalizedValue.toFixed(1)}${gaugeConfig.showUnit && config.dataMapping.unit ? ` ${config.dataMapping.unit}` : ""}`
          }
        />
      </Box>
    </Box>
  )
}

const TextVisualization: React.FC<{
  config: VisualizationConfig
  data: any
}> = ({ config, data }) => {
  const value = getNestedValue(data, config.dataMapping.fieldPath)

  return (
    <Box
      p={4}
      h="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      borderRadius="lg"
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      border="1px solid"
      borderColor="gray.200"
      bg="white"
      _hover={{
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      transition="all 0.2s"
    >
      <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.800">
        {config.title}
      </Text>
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color={config.dataMapping.color || "gray.700"}
      >
        {String(value || "N/A")}
      </Text>
    </Box>
  )
}

const NumberVisualization: React.FC<{
  config: VisualizationConfig
  data: any
}> = ({ config, data }) => {
  const value = getNestedValue(data, config.dataMapping.fieldPath)
  const numericValue = typeof value === "number" ? value : 0

  return (
    <Box
      p={4}
      h="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      borderRadius="lg"
      boxShadow="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      border="1px solid"
      borderColor="gray.200"
      bg="white"
      _hover={{
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      transition="all 0.2s"
    >
      <Text fontSize="lg" fontWeight="bold" mb={3} color="gray.800">
        {config.title}
      </Text>
      <Text
        fontSize="4xl"
        fontWeight="bold"
        color={config.dataMapping.color || "blue.500"}
      >
        {numericValue.toFixed(2)}
      </Text>
      {config.dataMapping.unit && (
        <Text fontSize="lg" color="gray.600" mt={2}>
          {config.dataMapping.unit}
        </Text>
      )}
    </Box>
  )
}

const JsonVisualization: React.FC<{
  config: VisualizationConfig
  data: any
}> = ({ config, data }) => {
  let value: any
  if (Array.isArray(config.dataMapping.fieldPath)) {
    value = {}
    for (const path of config.dataMapping.fieldPath) {
      value[path] = getNestedValue(data, path)
    }
  } else {
    value = getNestedValue(data, config.dataMapping.fieldPath)
  }
  return (
    <Box
      p={3}
      h="100%"
      display="flex"
      flexDirection="column"
      borderRadius="md"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      bg="white"
    >
      <Text
        fontSize="md"
        fontWeight="bold"
        mb={3}
        borderBottom="1px solid #e2e8f0"
        pb={2}
      >
        {config.title}
      </Text>
      <Box
        bg="gray.50"
        p={3}
        borderRadius="md"
        fontSize="xs"
        fontFamily="mono"
        flex="1"
        overflow="auto"
        width="100%"
        height="100%"
        display="flex"
      >
        <SyntaxHighlighter
          language="json"
          style={oneLight}
          customStyle={{
            margin: 0,
            width: "100%",
            height: "100%",
            background: "transparent",
          }}
          showLineNumbers
          wrapLongLines
        >
          {JSON.stringify(value, null, 2)}
        </SyntaxHighlighter>
      </Box>
    </Box>
  )
}

// 시각화 렌더러
const VisualizationRenderer: React.FC<{
  config: VisualizationConfig
  data: any
  dataHistory?: any[]
}> = ({ config, data, dataHistory = [] }) => {
  switch (config.type) {
    case "chart": {
      // 내부 chartType에 따라 분기
      const chartType = config.chartConfig?.chartType || "line"
      const xAxis = config.chartConfig?.xAxis || { fieldPath: "timestamp" }
      const yAxes =
        config.chartConfig?.yAxes && config.chartConfig.yAxes.length > 0
          ? config.chartConfig.yAxes
          : [{ fieldPath: config.dataMapping.fieldPath }]
      const chartConfig = {
        ...config,
        chartConfig: { ...config.chartConfig, chartType, xAxis, yAxes },
      }
      return (
        <EnhancedChartVisualization config={chartConfig} data={dataHistory} />
      )
    }
    case "lineChart":
    case "barChart":
    case "scatterChart":
    case "areaChart":
      return <EnhancedChartVisualization config={config} data={dataHistory} />
    case "gauge":
      return <EnhancedGaugeVisualization config={config} data={data} />
    case "text":
      return <TextVisualization config={config} data={data} />
    case "number":
      return <NumberVisualization config={config} data={data} />
    case "json":
      return <JsonVisualization config={config} data={data} />
    default:
      return <Text>Unknown visualization type: {config.type}</Text>
  }
}

export function UniversalWidget({
  robotId,
  config,
  connections,
  onUpdateConfig,
  onRemove,
}: UniversalWidgetProps) {
  const [stores, setStores] = useState<Map<string, any>>(new Map())
  const [data, setData] = useState<Map<string, any>>(new Map())
  const [dataHistory, setDataHistory] = useState<Map<string, any[]>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance()

  // 스토어 초기화 및 연결
  useEffect(() => {
    const newStores = new Map<string, any>()

    // 모든 스토어 가져오기
    const robotStores = readOnlyStoreManager.getReadOnlyStores(
      config.dataSources[0]?.robotId || "",
    )

    config.dataSources.forEach((dataSource) => {
      // 스토어 심볼에서 데이터 타입 추출하여 매칭
      const matchingStore = Array.from(robotStores.entries()).find(
        ([symbol, _]) => {
          const symbolStr = symbol.toString()
          const dataType = symbolStr.replace(/^Symbol\((.+)\)$/, "$1")
          return dataType === dataSource.dataType
        },
      )

      if (matchingStore) {
        const [_, store] = matchingStore
        newStores.set(dataSource.dataType, store)
      } else {
        console.warn(
          `UniversalWidget - 스토어를 찾을 수 없음: ${dataSource.dataType}`,
        )
      }
    })

    setStores(newStores)

    // 초기 데이터 설정
    const initialData = new Map<string, any>()
    newStores.forEach((store, dataType) => {
      const lastData = store.getLast?.()
      if (lastData) {
        initialData.set(dataType, lastData)
      }
    })

    if (initialData.size > 0) {
      setData(initialData)
      setIsConnected(true)
    }
  }, [config.dataSources, readOnlyStoreManager])

  // 데이터 구독
  useEffect(() => {
    if (stores.size === 0) return

    const unsubscribers: (() => void)[] = []

    stores.forEach((store, dataType) => {
      // 스토어가 유효한지 확인
      if (store && typeof store.subscribe === "function") {
        const unsubscribe = store.subscribe((newData: any) => {
          setData((prev) => new Map(prev).set(dataType, newData))
          setDataHistory((prev) => {
            const history = prev.get(dataType) || []
            const newHistory = [...history, newData].slice(-100) // 최근 100개 데이터 유지
            return new Map(prev).set(dataType, newHistory)
          })
          setIsConnected(true)
        })
        unsubscribers.push(unsubscribe)
      } else {
        console.warn(
          `UniversalWidget - ${dataType} 스토어가 유효하지 않음:`,
          store,
        )
      }
    })

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [stores])

  // 연결 상태 확인
  const isRobotConnected = connections
    ? config.dataSources.some((source) => connections[source.robotId])
    : false

  // 스토어 연결 상태 확인
  const areStoresConnected =
    stores.size > 0 &&
    Array.from(stores.values()).some((store) =>
      store && typeof store.isChannelConnected === "function"
        ? store.isChannelConnected()
        : false,
    )

  if (!isRobotConnected) {
    return (
      <WidgetFrame
        robot_id={robotId}
        title={config.title}
        isConnected={false}
        footerMessage="Robot not connected"
        onRemove={onRemove}
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="100%"
          color="gray.500"
        >
          <Text>Robot not connected</Text>
        </Flex>
      </WidgetFrame>
    )
  }

  if (!isConnected && !areStoresConnected) {
    return (
      <WidgetFrame
        robot_id={robotId}
        title={config.title}
        isConnected={false}
        footerMessage="Waiting for data..."
        onRemove={onRemove}
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="100%"
          color="gray.500"
        >
          <Text>Waiting for data...</Text>
          <Text fontSize="sm" mt={2}>
            스토어 연결 상태:{" "}
            {stores.size > 0 ? `${stores.size}개 스토어` : "스토어 없음"}
          </Text>
        </Flex>
      </WidgetFrame>
    )
  }

  // 레이아웃 렌더링
  const renderVisualizations = () => {
    const vizComponents = config.visualizations
      .map((viz) => {
        const dataSource = config.dataSources[viz.dataSourceIndex]

        if (!dataSource) {
          console.log(
            `UniversalWidget - 데이터 소스를 찾을 수 없음: ${viz.dataSourceIndex}`,
          )
          return null
        }

        const vizData = data.get(dataSource.dataType) || {}
        const vizDataHistory = dataHistory.get(dataSource.dataType) || []

        return (
          <VisualizationRenderer
            key={viz.id}
            config={viz}
            data={vizData}
            dataHistory={vizDataHistory}
          />
        )
      })
      .filter(Boolean)

    if (vizComponents.length === 1) {
      // 단일 컴포넌트는 바로 반환 (부모 영역을 꽉 채움)
      return vizComponents[0]
    }
    // 2개 이상일 때만 레이아웃 적용
    switch (config.layout) {
      case "grid":
        return (
          <Grid
            templateColumns="repeat(auto-fit, minmax(150px, 1fr))"
            gap={2}
            h="100%"
          >
            {vizComponents.map((component, index) => (
              <GridItem key={index}>{component}</GridItem>
            ))}
          </Grid>
        )
      case "horizontal":
        return (
          <HStack gap={2} align="stretch" h="100%">
            {vizComponents}
          </HStack>
        )
      default:
        return (
          <VStack gap={2} align="stretch" h="100%">
            {vizComponents}
          </VStack>
        )
    }
  }

  return (
    <WidgetFrame
      title={config.title}
      robot_id={robotId}
      isConnected={isConnected}
      footerMessage={`Connected to ${config.dataSources.length} data source(s)`}
      onRemove={onRemove}
    >
      {/* 설정 버튼만 남김 */}
      <Box display="flex" justifyContent="flex-end" alignItems="center">
        <IconButton
          aria-label="설정"
          size="sm"
          variant="ghost"
          onClick={() => setIsConfigOpen(true)}
        >
          <FiSettings />
        </IconButton>
      </Box>
      <Box p={2}>{renderVisualizations()}</Box>
      {/* 설정 모달 */}
      {isConfigOpen && (
        <UniversalWidgetConfigurator
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onComplete={(newConfig) => {
            setIsConfigOpen(false)
            onUpdateConfig?.(newConfig)
          }}
          robotId={config.dataSources[0]?.robotId || ""}
          initialConfig={config}
        />
      )}
    </WidgetFrame>
  )
}
