import React, { useEffect, useState, useMemo } from 'react'
import { Box, Text, Flex, Grid, GridItem, VStack, HStack, IconButton, Button } from '@chakra-ui/react'
import { WidgetFrame } from '../WidgetFrame'
import { ReadOnlyStoreManager } from '../../../../dashboard/store/data-channel-store/readonly/read-only-store-manager'
import { UniversalWidgetConfig, VisualizationConfig } from '../../../../dashboard/store/data-channel-store/readonly/dynamic/universal-widget-config'
import { DataChannelConfigUtils } from '../../../../rtc/webrtc-datachannel-config'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { FiSettings } from 'react-icons/fi'
import { UniversalWidgetConfigurator } from './UniversalWidgetConfigurator'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface UniversalWidgetProps {
  config: UniversalWidgetConfig
  connections?: { [key: string]: boolean }
  onUpdateConfig?: (newConfig: UniversalWidgetConfig) => void
  onRemove?: () => void
  widgetId?: string
}

// 중첩된 객체에서 값을 가져오는 유틸리티 함수
const getNestedValue = (obj: any, path: string): any => {
  if (!path) return obj; // 경로가 빈 문자열이면 전체 객체 반환
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return null
    
    // 배열 인덱스 처리 (예: "motor_state[0].q")
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/)
    if (arrayMatch) {
      const arrayKey = arrayMatch[1]
      const index = parseInt(arrayMatch[2])
      return current[arrayKey]?.[index]
    }
    
    return current[key]
  }, obj)
}

// 시각화 컴포넌트들
const LineChartVisualization: React.FC<{
  config: VisualizationConfig
  data: any[]
  maxDataPoints?: number
}> = ({ config, data, maxDataPoints = 50 }) => {
  const chartData = useMemo(() => {
    const recentData = data.slice(-maxDataPoints)
    const values = recentData.map(item => {
      const value = getNestedValue(item, config.dataMapping.fieldPath)
      return typeof value === 'number' ? value : 0
    })
    
    const labels = recentData.map(item => 
      new Date(item.timestamp).toLocaleTimeString()
    )
    
    return {
      labels,
      datasets: [{
        label: config.dataMapping.label || config.dataMapping.fieldPath,
        data: values,
        borderColor: config.dataMapping.color || '#3182ce',
        backgroundColor: config.dataMapping.color || '#3182ce',
        tension: 0.1
      }]
    }
  }, [data, config, maxDataPoints])

  return (
    <Box p={2}>
      <Text fontSize="sm" fontWeight="bold" mb={2}>{config.title}</Text>
      <Line 
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }}
        height={100}
      />
    </Box>
  )
}

const GaugeVisualization: React.FC<{
  config: VisualizationConfig
  data: any
}> = ({ config, data }) => {
  const value = getNestedValue(data, config.dataMapping.fieldPath)
  const numericValue = typeof value === 'number' ? value : 0
  
  return (
    <Box p={2} textAlign="center">
      <Text fontSize="sm" fontWeight="bold" mb={2}>{config.title}</Text>
      <Box
        w="80px"
        h="80px"
        borderRadius="50%"
        border="8px solid"
        borderColor="gray.200"
        display="flex"
        alignItems="center"
        justifyContent="center"
        mx="auto"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: `conic-gradient(${config.dataMapping.color || '#3182ce'} 0deg, ${config.dataMapping.color || '#3182ce'} ${Math.min(numericValue * 3.6, 360)}deg, #e2e8f0 ${Math.min(numericValue * 3.6, 360)}deg, #e2e8f0 360deg)`
        }}
      >
        <Text fontSize="lg" fontWeight="bold" zIndex={1}>
          {numericValue.toFixed(1)}
        </Text>
      </Box>
      {config.dataMapping.unit && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {config.dataMapping.unit}
        </Text>
      )}
    </Box>
  )
}

const TextVisualization: React.FC<{
  config: VisualizationConfig
  data: any
}> = ({ config, data }) => {
  const value = getNestedValue(data, config.dataMapping.fieldPath)
  
  return (
    <Box p={2}>
      <Text fontSize="sm" fontWeight="bold" mb={1}>{config.title}</Text>
      <Text fontSize="lg" color={config.dataMapping.color || 'inherit'}>
        {String(value || 'N/A')}
      </Text>
    </Box>
  )
}

const NumberVisualization: React.FC<{
  config: VisualizationConfig
  data: any
}> = ({ config, data }) => {
  const value = getNestedValue(data, config.dataMapping.fieldPath)
  const numericValue = typeof value === 'number' ? value : 0
  
  console.log('NumberVisualization - 렌더링:', { config, data, value, numericValue })
  
  return (
    <Box
      p={3}
      h="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      borderRadius="md"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      bg="white"
    >
      <Text fontSize="sm" fontWeight="bold" mb={2}>{config.title}</Text>
      <Text fontSize="2xl" fontWeight="bold" color={config.dataMapping.color || 'inherit'}>
        {numericValue.toFixed(2)}
      </Text>
      {config.dataMapping.unit && (
        <Text fontSize="xs" color="gray.500">
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
      <Text fontSize="md" fontWeight="bold" mb={3} borderBottom="1px solid #e2e8f0" pb={2}>{config.title}</Text>
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
          customStyle={{ margin: 0, width: "100%", height: "100%", background: "transparent" }}
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
  console.log('VisualizationRenderer - 렌더링:', { config, data, dataHistory })
  
  switch (config.type) {
    case 'lineChart':
      return <LineChartVisualization config={config} data={dataHistory} />
    case 'gauge':
      return <GaugeVisualization config={config} data={data} />
    case 'text':
      return <TextVisualization config={config} data={data} />
    case 'number':
      return <NumberVisualization config={config} data={data} />
    case 'json':
      return <JsonVisualization config={config} data={data} />
    default:
      return <Text>Unknown visualization type: {config.type}</Text>
  }
}

export function UniversalWidget({ config, connections, onUpdateConfig, onRemove, widgetId }: UniversalWidgetProps) {
  const [stores, setStores] = useState<Map<string, any>>(new Map())
  const [data, setData] = useState<Map<string, any>>(new Map())
  const [dataHistory, setDataHistory] = useState<Map<string, any[]>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  
  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance()

  // 스토어 초기화 및 연결
  useEffect(() => {
    const newStores = new Map<string, any>()
    
    console.log('UniversalWidget - 스토어 초기화 시작:', config.dataSources)
    
    config.dataSources.forEach(dataSource => {
      // 올바른 심볼로 스토어 가져오기
      const storeSymbol = DataChannelConfigUtils.getStoreSymbol(dataSource.dataType)
      console.log(`UniversalWidget - 데이터 타입: ${dataSource.dataType}, 심볼:`, storeSymbol)
      
      if (storeSymbol) {
        const store = readOnlyStoreManager.getStore(dataSource.robotId, storeSymbol)
        console.log(`UniversalWidget - 스토어 찾음:`, store)
        if (store) {
          newStores.set(dataSource.dataType, store)
        }
      }
    })
    
    console.log('UniversalWidget - 최종 스토어 맵:', newStores)
    setStores(newStores)
  }, [config.dataSources, readOnlyStoreManager])

  // 데이터 구독
  useEffect(() => {
    const unsubscribers: (() => void)[] = []
    
    console.log('UniversalWidget - 데이터 구독 시작, 스토어 개수:', stores.size)
    
    stores.forEach((store, dataType) => {
      console.log(`UniversalWidget - ${dataType} 스토어 구독 시작`)
      const unsubscribe = store.subscribe((newData: any) => {
        console.log(`UniversalWidget - ${dataType} 데이터 수신:`, newData)
        setData(prev => new Map(prev).set(dataType, newData))
        setDataHistory(prev => {
          const history = prev.get(dataType) || []
          const newHistory = [...history, newData].slice(-100) // 최근 100개 데이터 유지
          return new Map(prev).set(dataType, newHistory)
        })
        setIsConnected(true)
      })
      unsubscribers.push(unsubscribe)
    })
    
    return () => {
      console.log('UniversalWidget - 구독 해제')
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [stores])

  // 연결 상태 확인
  const isRobotConnected = connections ? 
    config.dataSources.some(source => connections[source.robotId]) : false

  if (!isRobotConnected) {
    return (
      <WidgetFrame
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

  if (!isConnected) {
    return (
      <WidgetFrame
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
        </Flex>
      </WidgetFrame>
    )
  }

  // 레이아웃 렌더링
  const renderVisualizations = () => {
    console.log('UniversalWidget - 시각화 렌더링 시작')
    console.log('UniversalWidget - config.visualizations:', config.visualizations)
    console.log('UniversalWidget - data:', data)
    console.log('UniversalWidget - dataHistory:', dataHistory)
    
    const vizComponents = config.visualizations.map(viz => {
      const dataSource = config.dataSources[viz.dataSourceIndex]
      console.log(`UniversalWidget - 시각화 ${viz.id}:`, { 
        viz: JSON.stringify(viz, null, 2), 
        dataSource: JSON.stringify(dataSource, null, 2) 
      })
      
      if (!dataSource) {
        console.log(`UniversalWidget - 데이터 소스를 찾을 수 없음: ${viz.dataSourceIndex}`)
        return null
      }
      
      const vizData = data.get(dataSource.dataType) || {}
      const vizDataHistory = dataHistory.get(dataSource.dataType) || []
      console.log(`UniversalWidget - 시각화 데이터:`, { 
        vizData: JSON.stringify(vizData, null, 2), 
        vizDataHistoryLength: vizDataHistory.length 
      })
      
      const component = (
        <VisualizationRenderer
          key={viz.id}
          config={viz}
          data={vizData}
          dataHistory={vizDataHistory}
        />
      )
      
      console.log(`UniversalWidget - 생성된 컴포넌트:`, component)
      return component
    }).filter(Boolean)

    console.log('UniversalWidget - 레이아웃 렌더링:', { layout: config.layout, vizComponentsCount: vizComponents.length })
    
    if (vizComponents.length === 1) {
      // 단일 컴포넌트는 바로 반환 (부모 영역을 꽉 채움)
      return vizComponents[0];
    }
    // 2개 이상일 때만 레이아웃 적용
    switch (config.layout) {
      case 'grid':
        return (
          <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={2} h="100%">
            {vizComponents.map((component, index) => (
              <GridItem key={index}>{component}</GridItem>
            ))}
          </Grid>
        );
      case 'horizontal':
        return (
          <HStack gap={2} align="stretch" h="100%">
            {vizComponents}
          </HStack>
        );
      case 'vertical':
      default:
        return (
          <VStack gap={2} align="stretch" h="100%">
            {vizComponents}
          </VStack>
        );
    }
  }

  return (
    <WidgetFrame
      title={config.title}
      isConnected={isConnected}
      footerMessage={`Connected to ${config.dataSources.length} data source(s)`}
      onRemove={onRemove}
    >
      {/* 설정 버튼만 남김 */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
        <IconButton
          aria-label="설정"
          size="sm"
          variant="ghost"
          onClick={() => setIsConfigOpen(true)}
        >
          <FiSettings />
        </IconButton>
      </Box>
      <Box p={2} h="100%">
        {renderVisualizations()}
      </Box>
      {/* 설정 모달 */}
      {isConfigOpen && (
        <UniversalWidgetConfigurator
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onComplete={(newConfig) => {
            setIsConfigOpen(false)
            onUpdateConfig?.(newConfig)
          }}
          robotId={config.dataSources[0]?.robotId || ''}
          initialConfig={config}
        />
      )}
    </WidgetFrame>
  )
} 