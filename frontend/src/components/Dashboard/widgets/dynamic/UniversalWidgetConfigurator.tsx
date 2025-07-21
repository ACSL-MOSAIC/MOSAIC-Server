import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  Field,
  IconButton,
  Fieldset,
  Portal
} from '@chakra-ui/react'
// Simple icon components
const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)
import { UniversalWidgetConfig, DataSourceConfig, VisualizationConfig, VisualizationType, UniversalWidgetConfigUtils, ChartConfig, ChartAxisConfig } from './universal-widget-config'
import { DataChannelConfigUtils } from '../../../../rtc/config/webrtc-datachannel-config'
import { ReadOnlyStoreManager } from '../../../../dashboard/store/data-channel-store/readonly/read-only-store-manager'
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

function getFieldPathsFromSample(obj: any, prefix = ''): { path: string, type: string }[] {
  if (typeof obj !== 'object' || obj === null) return []
  let paths: { path: string, type: string }[] = []
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue
    const value = obj[key]
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // 배열이면 첫 번째 요소만 예시로
        if (value.length > 0 && typeof value[0] === 'object') {
          paths = paths.concat(getFieldPathsFromSample(value[0], `${path}[0]`))
        } else {
          // 배열의 타입 추론
          const arrType = value.length > 0 ? typeof value[0] : 'any'
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
  initialConfig 
}: UniversalWidgetConfiguratorProps) {
  const [config, setConfig] = useState<UniversalWidgetConfig>(
    initialConfig || {
      id: `universal_${Date.now()}`,
      title: 'Universal Widget',
      dataSources: [],
      visualizations: [],
      layout: 'grid'
    }
  )

  const readOnlyStoreManager = ReadOnlyStoreManager.getInstance()
  const robotStores = readOnlyStoreManager.getReadOnlyStores(robotId)
  const connectedStores = readOnlyStoreManager.getConnectedReadOnlyStores(robotId)
  
  // 스토어 정보를 담은 배열 생성 (심볼 -> 데이터 타입 매핑)
  const storeInfo = Array.from(robotStores.entries()).map(([symbol, store]) => {
    const symbolStr = symbol.toString()
    // 심볼에서 데이터 타입 추출 (예: Symbol(go2_low_state) -> go2_low_state)
    const dataType = symbolStr.replace(/^Symbol\((.+)\)$/, '$1')
    const isConnected = connectedStores.includes(store)
    
    return {
      symbol,
      store,
      dataType,
      isConnected,
      storeName: store.constructor.name,
      lastData: store.getLast?.() || null
    }
  })
  
  // 연결된 스토어만 필터링 (선택사항)
  const availableStores = storeInfo.filter(info => info.isConnected)
  const availableDataTypes = availableStores.map(info => info.dataType)

  // 데이터 소스 추가
  const addDataSource = () => {
    if (availableStores.length === 0) return
    
    const newDataSource: DataSourceConfig = {
      robotId,
      dataType: availableStores[0].dataType
    }
    
    setConfig(prev => ({
      ...prev,
      dataSources: [...prev.dataSources, newDataSource]
    }))
  }

  // 데이터 소스 제거
  const removeDataSource = (index: number) => {
    setConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.filter((_, i) => i !== index),
      visualizations: prev.visualizations.filter(v => v.dataSourceIndex !== index)
    }))
  }

  // 데이터 소스 변경
  const updateDataSource = (index: number, dataType: string) => {
    setConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.map((ds, i) => 
        i === index ? { ...ds, dataType } : ds
      )
    }))
  }

  // 시각화 추가
  const addVisualization = (dataSourceIndex: number) => {
    const dataSource = config.dataSources[dataSourceIndex]
    if (!dataSource) return

    const newVisualization: VisualizationConfig = {
      id: `viz_${Date.now()}`,
      type: 'number',
      title: 'New Visualization',
      dataSourceIndex,
      dataMapping: {
        fieldPath: ''
      }
    }
    
    setConfig(prev => ({
      ...prev,
      visualizations: [...prev.visualizations, newVisualization]
    }))
  }

  // 시각화 제거
  const removeVisualization = (visualizationId: string) => {
    setConfig(prev => ({
      ...prev,
      visualizations: prev.visualizations.filter(v => v.id !== visualizationId)
    }))
  }

  // 시각화 업데이트
  const updateVisualization = (visualizationId: string, updates: Partial<VisualizationConfig>) => {
    setConfig(prev => ({
      ...prev,
      visualizations: prev.visualizations.map(v => 
        v.id === visualizationId ? { ...v, ...updates } : v
      )
    }))
  }

  // 설정 저장
  const handleSave = () => {
    if (config.title.trim() === '') {
      alert('위젯 제목을 입력해주세요.')
      return
    }
    
    if (config.dataSources.length === 0) {
      alert('최소 하나의 데이터 소스를 추가해주세요.')
      return
    }
    
    if (config.visualizations.length === 0) {
      alert('최소 하나의 시각화를 추가해주세요.')
      return
    }
    
    // fieldPath 타입 정리
    const newConfig = {
      ...config,
      visualizations: config.visualizations.map(viz => ({
        ...viz,
        dataMapping: {
          ...viz.dataMapping,
          fieldPath: viz.type === 'json'
            ? (Array.isArray(viz.dataMapping.fieldPath) ? viz.dataMapping.fieldPath : [viz.dataMapping.fieldPath].filter(Boolean))
            : (Array.isArray(viz.dataMapping.fieldPath) ? viz.dataMapping.fieldPath[0] || '' : viz.dataMapping.fieldPath)
        }
      }))
    }
    onComplete(newConfig)
    onClose()
  }

  // 필드 경로 자동 추출용 상태
  const [fieldPathOptions, setFieldPathOptions] = useState<{ path: string, type: string }[]>([])

  // 데이터 타입 변경 시 필드 경로 자동 추출
  useEffect(() => {
    if (config.dataSources.length === 0) return
    const dataSource = config.dataSources[config.dataSources.length - 1]
    
    // 스토어 정보에서 해당 데이터 타입의 스토어 찾기
    const selectedStoreInfo = availableStores.find(info => info.dataType === dataSource.dataType)
    
    if (selectedStoreInfo?.lastData) {
      const paths = getFieldPathsFromSample(selectedStoreInfo.lastData)
      setFieldPathOptions(paths)
    } else {
      setFieldPathOptions([])
    }
  }, [config.dataSources, availableStores])

  // 시각화 타입에 따라 필드 경로 옵션 필터링
  const getFilteredFieldPathOptions = (vizType: string) => {
    switch (vizType) {
      case 'number':
      case 'gauge':
      case 'lineChart':
        return fieldPathOptions.filter(opt => opt.type === 'number')
      case 'text':
        return fieldPathOptions.filter(opt => ['string', 'number', 'boolean'].includes(opt.type))
      case 'json':
      default:
        return fieldPathOptions
    }
  }

  // yAxes, xAxis 기본값 보장
  const getYAxisArray = (chartConfig: ChartConfig | undefined, fallbackField: string): ChartAxisConfig[] => {
    if (chartConfig && Array.isArray(chartConfig.yAxes) && chartConfig.yAxes.length > 0) return chartConfig.yAxes
    return [{ fieldPath: fallbackField }]
  }
  const getXAxis = (chartConfig: ChartConfig | undefined): ChartAxisConfig => {
    if (chartConfig && chartConfig.xAxis) return chartConfig.xAxis
    return { fieldPath: 'timestamp' }
  }

  // chartConfig 업데이트 시 항상 xAxis, yAxes 기본값 보장
  const updateChartConfig = (oldConfig: ChartConfig | undefined, updates: Partial<ChartConfig>, fallbackField: string): ChartConfig => {
    return {
      xAxis: oldConfig?.xAxis || { fieldPath: 'timestamp' },
      yAxes: oldConfig?.yAxes && oldConfig.yAxes.length > 0 ? oldConfig.yAxes : [{ fieldPath: fallbackField }],
      chartType: updates.chartType || oldConfig?.chartType || 'line',
      ...oldConfig,
      ...updates
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
          overflow: 'visible',
          position: 'relative',
          zIndex: 1000
        }}
      >
        <DialogCloseTrigger />
        <DialogHeader>
          <DialogTitle>{initialConfig ? '범용 위젯 편집' : '범용 위젯 생성'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} align="stretch">

        {/* 기본 설정 */}
        <Fieldset.Root mb={4} style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
          <Fieldset.Legend><Text fontWeight="bold" fontSize="md">기본 설정</Text></Fieldset.Legend>
          <Fieldset.Content>
            <Field.Root>
              <Field.Label>위젯 제목</Field.Label>
              <Input
                value={config.title}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="위젯 제목을 입력하세요"
              />
            </Field.Root>
            
            <Field.Root mt={3}>
              <Field.Label>레이아웃</Field.Label>
              <select
                value={config.layout}
                onChange={(e) => setConfig(prev => ({ ...prev, layout: e.target.value as any }))}
                style={{
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  width: '100%'
                }}
              >
                <option value="grid">그리드</option>
                <option value="vertical">세로</option>
                <option value="horizontal">가로</option>
              </select>
            </Field.Root>
          </Fieldset.Content>
        </Fieldset.Root>
        <Box as="hr" my={2} borderColor="#e2e8f0" />
        {/* 데이터 소스 설정 */}
        <Fieldset.Root mb={4} style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
          <Fieldset.Legend><Text fontWeight="bold" fontSize="md">데이터 소스</Text></Fieldset.Legend>
          <Fieldset.Content>
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="bold">데이터 소스</Text>
              <Button 
                size="sm" 
                onClick={addDataSource}
                disabled={availableStores.length === 0}
              >
                <AddIcon />
                데이터 소스 추가
              </Button>
            </HStack>
            
            {availableStores.length === 0 ? (
              <Box p={4} textAlign="center" color="gray.500" bg="#fff" borderRadius="md" border="1px solid #e2e8f0">
                <Text fontSize="sm">연결된 스토어가 없습니다.</Text>
                <Text fontSize="xs" mt={1}>로봇과 연결 후 스토어를 사용할 수 있습니다.</Text>
              </Box>
            ) : (
              config.dataSources.map((dataSource, index) => (
              <Box key={index} p={3} border="1px solid #e2e8f0" borderRadius="md" mb={2} bg="#fff" display="flex" flexDirection="column" gap={2}>
                <HStack justify="space-between" alignItems="center" mb={2}>
                  <Text fontSize="sm" fontWeight="bold">데이터 소스 {index + 1}</Text>
                  <IconButton
                    aria-label="데이터 소스 제거"
                    size="xs"
                    variant="ghost"
                    onClick={() => removeDataSource(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </HStack>
                
                <Field.Root>
                  <Field.Label fontSize="sm">스토어 선택</Field.Label>
                  <select
                    value={dataSource.dataType}
                    onChange={(e) => updateDataSource(index, e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      width: '100%',
                      fontSize: '14px'
                    }}
                  >
                    {availableStores.map(storeInfo => (
                      <option key={storeInfo.dataType} value={storeInfo.dataType}>
                        {storeInfo.storeName} ({storeInfo.dataType}) - {storeInfo.isConnected ? '연결됨' : '연결 안됨'}
                      </option>
                    ))}
                  </select>
                </Field.Root>
                
                {/* 선택된 스토어의 샘플 데이터 미리보기 */}
                {(() => {
                  const selectedStoreInfo = availableStores.find(info => info.dataType === dataSource.dataType)
                  if (selectedStoreInfo?.lastData) {
                    return (
                      <Field.Root>
                        <Field.Label fontSize="sm">샘플 데이터</Field.Label>
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
                          <pre>{JSON.stringify(selectedStoreInfo.lastData, null, 2)}</pre>
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
        {/* 시각화 설정 */}
        <Fieldset.Root mb={4} style={{ background: '#f8fafc', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
          <Fieldset.Legend><Text fontWeight="bold" fontSize="md">시각화</Text></Fieldset.Legend>
          <Fieldset.Content>
            {config.dataSources.map((dataSource, dataSourceIndex) => (
              <Box key={dataSourceIndex} mb={4}>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="bold">
                    {dataSource.dataType} 시각화
                  </Text>
                  <Button 
                    size="sm" 
                    onClick={() => addVisualization(dataSourceIndex)}
                  >
                    <AddIcon />
                    시각화 추가
                  </Button>
                </HStack>
                
                {config.visualizations
                  .filter(v => v.dataSourceIndex === dataSourceIndex)
                  .map(visualization => (
                    <Box key={visualization.id} p={3} border="1px solid #e2e8f0" borderRadius="md" mb={2} bg="#fff" display="flex" flexDirection="column" gap={2}>
                      <HStack justify="space-between" alignItems="center" mb={2}>
                        <Text fontSize="sm" fontWeight="bold">시각화: {visualization.title}</Text>
                        <IconButton
                          aria-label="시각화 제거"
                          size="xs"
                          variant="ghost"
                          onClick={() => removeVisualization(visualization.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </HStack>
                      
                      <VStack gap={2} align="stretch">
                        <Field.Root>
                          <Field.Label>제목</Field.Label>
                          <Input
                            size="sm"
                            value={visualization.title}
                            onChange={(e) => updateVisualization(visualization.id, { title: e.target.value })}
                          />
                        </Field.Root>
                        
                        <Field.Root>
                          <Field.Label>Visualization Type</Field.Label>
                          <select
                            value={visualization.type}
                            onChange={(e) => updateVisualization(visualization.id, { type: e.target.value as VisualizationType })}
                            style={{
                              padding: '8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              width: '100%',
                              fontSize: '14px'
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
                        {visualization.type === 'chart' && (
                          <>
                            <Field.Root>
                              <Field.Label fontSize="sm">Chart Type</Field.Label>
                              <select
                                value={visualization.chartConfig?.chartType ?? 'line'}
                                onChange={(e) => updateVisualization(visualization.id, { 
                                  chartConfig: updateChartConfig(visualization.chartConfig, { chartType: e.target.value as any }, visualization.dataMapping.fieldPath)
                                })}
                                style={{
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  width: '100%',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="line">Line Chart</option>
                                <option value="bar">Bar Chart</option>
                                <option value="scatter">Scatter Chart</option>
                                <option value="area">Area Chart</option>
                              </select>
                            </Field.Root>
                          </>
                        )}
                        
                        <Field.Root>
                          <Field.Label>데이터 필드 경로</Field.Label>
                          <Box display="flex" flexDirection="column" gap={2}>
                            {visualization.type === 'json' ? (
                              <>
                                {(Array.isArray(visualization.dataMapping.fieldPath) ? visualization.dataMapping.fieldPath : [visualization.dataMapping.fieldPath].filter(Boolean)).map((field, idx, arr) => (
                                  <Box key={idx} display="flex" gap={2} alignItems="center" mb={1}>
                                    <Input
                                      size="sm"
                                      value={field}
                                      onChange={e => {
                                        const newFields = [...arr]
                                        newFields[idx] = e.target.value
                                        updateVisualization(visualization.id, { dataMapping: { ...visualization.dataMapping, fieldPath: newFields } })
                                      }}
                                      placeholder="필드 경로"
                                      flex="1"
                                    />
                                    {getFilteredFieldPathOptions(visualization.type).length > 0 && (
                                      <select
                                        value={field}
                                        onChange={e => {
                                          const newFields = [...arr]
                                          newFields[idx] = e.target.value
                                          updateVisualization(visualization.id, { dataMapping: { ...visualization.dataMapping, fieldPath: newFields } })
                                        }}
                                        style={{ minWidth: 120 }}
                                      >
                                        <option value="">필드 선택</option>
                                        {getFilteredFieldPathOptions(visualization.type).map(opt => (
                                          <option key={opt.path} value={opt.path}>{opt.path} ({opt.type})</option>
                                        ))}
                                      </select>
                                    )}
                                    {arr.length > 1 && (
                                      <Button size="xs" colorScheme="red" variant="ghost" onClick={() => {
                                        const newFields = arr.filter((_, i) => i !== idx)
                                        updateVisualization(visualization.id, { dataMapping: { ...visualization.dataMapping, fieldPath: newFields } })
                                      }}>-</Button>
                                    )}
                                  </Box>
                                ))}
                                <Button size="xs" colorScheme="blue" variant="outline" mt={1} onClick={() => {
                                  const arr = Array.isArray(visualization.dataMapping.fieldPath) ? visualization.dataMapping.fieldPath : [visualization.dataMapping.fieldPath].filter(Boolean)
                                  updateVisualization(visualization.id, { dataMapping: { ...visualization.dataMapping, fieldPath: [...arr, ''] } })
                                }}>+ 필드 추가</Button>
                              </>
                            ) : (
                              <Box display="flex" gap={2} alignItems="center">
                                <Input
                                  size="sm"
                                  value={Array.isArray(visualization.dataMapping.fieldPath) ? visualization.dataMapping.fieldPath[0] || '' : visualization.dataMapping.fieldPath}
                                  onChange={(e) => updateVisualization(visualization.id, { 
                                    dataMapping: { ...visualization.dataMapping, fieldPath: e.target.value }
                                  })}
                                  placeholder="예: motor_state[0].q, power_v"
                                  flex="1"
                                />
                                {getFilteredFieldPathOptions(visualization.type).length > 0 && (
                                  <select
                                    value={Array.isArray(visualization.dataMapping.fieldPath) ? visualization.dataMapping.fieldPath[0] || '' : visualization.dataMapping.fieldPath}
                                    onChange={e => updateVisualization(visualization.id, { dataMapping: { ...visualization.dataMapping, fieldPath: e.target.value } })}
                                    style={{ minWidth: 120 }}
                                  >
                                    <option value="">필드 선택</option>
                                    {getFilteredFieldPathOptions(visualization.type).map(opt => (
                                      <option key={opt.path} value={opt.path}>{opt.path} ({opt.type})</option>
                                    ))}
                                  </select>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Field.Root>
                        
                        <Field.Root>
                          <Field.Label>라벨</Field.Label>
                          <Input
                            size="sm"
                            value={visualization.dataMapping.label || ''}
                            onChange={(e) => updateVisualization(visualization.id, { 
                              dataMapping: { ...visualization.dataMapping, label: e.target.value }
                            })}
                            placeholder="표시될 라벨"
                          />
                        </Field.Root>
                        
                        <Field.Root>
                          <Field.Label>단위</Field.Label>
                          <Input
                            size="sm"
                            value={visualization.dataMapping.unit || ''}
                            onChange={(e) => updateVisualization(visualization.id, { 
                              dataMapping: { ...visualization.dataMapping, unit: e.target.value }
                            })}
                            placeholder="예: V, A, rad/s"
                          />
                        </Field.Root>
                        
                        {/* 차트 전용 설정 */}
                        {(visualization.type === 'lineChart' || visualization.type === 'barChart' || visualization.type === 'scatterChart' || visualization.type === 'areaChart') && (
                          <>
                            <Field.Root>
                              <Field.Label fontSize="sm">X Axis Field</Field.Label>
                              <select
                                value={visualization.chartConfig?.xAxis?.fieldPath || 'timestamp'}
                                onChange={(e) => updateVisualization(visualization.id, { 
                                  chartConfig: updateChartConfig(visualization.chartConfig, { xAxis: { fieldPath: e.target.value } }, visualization.dataMapping.fieldPath)
                                })}
                                style={{
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  width: '100%',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="timestamp">timestamp</option>
                                {fieldPathOptions.map(opt => (
                                  <option key={opt.path} value={opt.path}>{opt.path} ({opt.type})</option>
                                ))}
                              </select>
                            </Field.Root>
                            <Field.Root>
                              <Field.Label fontSize="sm">Y Axes</Field.Label>
                              <VStack gap={2} align="stretch">
                                {getYAxisArray(visualization.chartConfig, visualization.dataMapping.fieldPath).map((yAxis: ChartAxisConfig, yIdx: number, arr: ChartAxisConfig[]) => (
                                  <Box key={yIdx} display="flex" gap={2} alignItems="center" border="1px solid #e2e8f0" borderRadius="md" p={2} bg="#fff">
                                    <select
                                      value={typeof yAxis.fieldPath === 'string' ? yAxis.fieldPath : ''}
                                      onChange={e => {
                                        const newYAxes = [...getYAxisArray(visualization.chartConfig, visualization.dataMapping.fieldPath)]
                                        newYAxes[yIdx] = { ...newYAxes[yIdx], fieldPath: e.target.value }
                                        updateVisualization(visualization.id, { chartConfig: updateChartConfig(visualization.chartConfig, { yAxes: newYAxes }, visualization.dataMapping.fieldPath) })
                                      }}
                                      style={{ minWidth: 120 }}
                                    >
                                      <option value="">Select field</option>
                                      {fieldPathOptions.filter(opt => opt.type === 'number').map(opt => (
                                        <option key={String(opt.path)} value={typeof opt.path === 'string' ? opt.path : ''}>{typeof opt.path === 'string' ? opt.path : ''} ({opt.type})</option>
                                      ))}
                                    </select>
                                    <Input
                                      size="sm"
                                      value={typeof yAxis.label === 'string' ? yAxis.label : ''}
                                      onChange={e => {
                                        const newYAxes = [...getYAxisArray(visualization.chartConfig, visualization.dataMapping.fieldPath)]
                                        newYAxes[yIdx] = { ...newYAxes[yIdx], label: e.target.value }
                                        updateVisualization(visualization.id, { chartConfig: updateChartConfig(visualization.chartConfig, { yAxes: newYAxes }, visualization.dataMapping.fieldPath) })
                                      }}
                                    />
                                    <Input
                                      size="sm"
                                      value={typeof yAxis.color === 'string' ? yAxis.color : ''}
                                      onChange={e => {
                                        const newYAxes = [...getYAxisArray(visualization.chartConfig, visualization.dataMapping.fieldPath)]
                                        newYAxes[yIdx] = { ...newYAxes[yIdx], color: e.target.value }
                                        updateVisualization(visualization.id, { chartConfig: updateChartConfig(visualization.chartConfig, { yAxes: newYAxes }, visualization.dataMapping.fieldPath) })
                                      }}
                                    />
                                    <Input
                                      size="sm"
                                      value={typeof yAxis.unit === 'string' ? yAxis.unit : ''}
                                      onChange={e => {
                                        const newYAxes = [...getYAxisArray(visualization.chartConfig, visualization.dataMapping.fieldPath)]
                                        newYAxes[yIdx] = { ...newYAxes[yIdx], unit: e.target.value }
                                        updateVisualization(visualization.id, { chartConfig: updateChartConfig(visualization.chartConfig, { yAxes: newYAxes }, visualization.dataMapping.fieldPath) })
                                      }}
                                    />
                                    {arr.length > 1 && (
                                      <Button size="xs" colorScheme="red" variant="ghost" onClick={() => {
                                        const newYAxes = arr.filter((_, i) => i !== yIdx)
                                        updateVisualization(visualization.id, { chartConfig: updateChartConfig(visualization.chartConfig, { yAxes: newYAxes }, visualization.dataMapping.fieldPath) })
                                      }}>-</Button>
                                    )}
                                  </Box>
                                ))}
                                <Button size="xs" colorScheme="blue" variant="outline" mt={1} onClick={() => {
                                  const yAxes = getYAxisArray(visualization.chartConfig, visualization.dataMapping.fieldPath)
                                  updateVisualization(visualization.id, { chartConfig: updateChartConfig(visualization.chartConfig, { yAxes: [...yAxes, { fieldPath: '' }], xAxis: getXAxis(visualization.chartConfig) }, visualization.dataMapping.fieldPath) })
                                }}>+ Add Y Axis</Button>
                              </VStack>
                            </Field.Root>
                            <Field.Root>
                              <Field.Label fontSize="sm">Chart Type</Field.Label>
                              <select
                                value={visualization.chartConfig?.chartType ?? 'line'}
                                onChange={(e) => updateVisualization(visualization.id, { 
                                  chartConfig: updateChartConfig(visualization.chartConfig, { chartType: e.target.value as any }, visualization.dataMapping.fieldPath)
                                })}
                                style={{
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  width: '100%',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="line">Line Chart</option>
                                <option value="bar">Bar Chart</option>
                                <option value="scatter">Scatter Chart</option>
                                <option value="area">Area Chart</option>
                              </select>
                            </Field.Root>
                          </>
                        )}
                        
                        {/* 게이지 전용 설정 */}
                        {visualization.type === 'gauge' && (
                          <>
                            <Field.Root>
                              <Field.Label fontSize="sm">최소값</Field.Label>
                              <Input
                                size="sm"
                                type="number"
                                value={visualization.gaugeConfig?.min || 0}
                                onChange={(e) => updateVisualization(visualization.id, { 
                                  gaugeConfig: { 
                                    ...visualization.gaugeConfig,
                                    min: parseFloat(e.target.value) || 0
                                  }
                                })}
                                placeholder="0"
                              />
                            </Field.Root>
                            
                            <Field.Root>
                              <Field.Label fontSize="sm">최대값</Field.Label>
                              <Input
                                size="sm"
                                type="number"
                                value={visualization.gaugeConfig?.max || 100}
                                onChange={(e) => updateVisualization(visualization.id, { 
                                  gaugeConfig: { 
                                    ...visualization.gaugeConfig,
                                    max: parseFloat(e.target.value) || 100
                                  }
                                })}
                                placeholder="100"
                              />
                            </Field.Root>
                            
                            <Field.Root>
                              <Field.Label fontSize="sm">게이지 크기</Field.Label>
                              <select
                                value={visualization.gaugeConfig?.size || 'medium'}
                                onChange={(e) => updateVisualization(visualization.id, { 
                                  gaugeConfig: { 
                                    ...visualization.gaugeConfig,
                                    size: e.target.value as any
                                  }
                                })}
                                style={{
                                  padding: '8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  width: '100%',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="small">작음</option>
                                <option value="medium">보통</option>
                                <option value="large">큼</option>
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
            <Button
              variant="subtle"
              colorPalette="gray"
              onClick={onClose}
            >
              취소
            </Button>
          </DialogActionTrigger>
          <Button
            variant="solid"
            colorPalette="blue"
            onClick={handleSave}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
} 