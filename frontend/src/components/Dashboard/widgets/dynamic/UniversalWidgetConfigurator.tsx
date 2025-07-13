import React, { useState } from 'react'
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
import { UniversalWidgetConfig, DataSourceConfig, VisualizationConfig, VisualizationType } from '../../../../dashboard/store/data-channel-store/readonly/dynamic/universal-widget-config'
import { DataChannelConfigUtils } from '../../../../rtc/webrtc-datachannel-config'
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

  // 사용 가능한 데이터 타입들 (readonly만)
  const availableDataTypes = DataChannelConfigUtils.getReadOnlyDataTypes()

  // 데이터 소스 추가
  const addDataSource = () => {
    const newDataSource: DataSourceConfig = {
      robotId,
      dataType: availableDataTypes[0] || 'go2_low_state'
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
    
    onComplete(config)
    onClose()
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
        <Fieldset.Root>
          <Fieldset.Legend>기본 설정</Fieldset.Legend>
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

        {/* 데이터 소스 설정 */}
        <Fieldset.Root>
          <Fieldset.Legend>데이터 소스</Fieldset.Legend>
          <Fieldset.Content>
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="bold">데이터 소스</Text>
              <Button size="sm" onClick={addDataSource}>
                <AddIcon />
                데이터 소스 추가
              </Button>
            </HStack>
            
            {config.dataSources.map((dataSource, index) => (
              <Box key={index} p={3} border="1px" borderColor="gray.200" borderRadius="md" mb={2}>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="bold">데이터 소스 {index + 1}</Text>
                  <IconButton
                    size="sm"
                    onClick={() => removeDataSource(index)}
                    aria-label="데이터 소스 제거"
                    colorScheme="red"
                    variant="ghost"
                  >
                    <DeleteIcon />
                  </IconButton>
                </HStack>
                
                <Field.Root>
                  <Field.Label fontSize="sm">데이터 타입</Field.Label>
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
                    {availableDataTypes.map(dataType => (
                      <option key={dataType} value={dataType}>
                        {dataType}
                      </option>
                    ))}
                  </select>
                </Field.Root>
              </Box>
            ))}
          </Fieldset.Content>
        </Fieldset.Root>

        {/* 시각화 설정 */}
        <Fieldset.Root>
          <Fieldset.Legend>시각화</Fieldset.Legend>
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
                    <Box key={visualization.id} p={3} border="1px" borderColor="gray.200" borderRadius="md" mb={2}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm">시각화: {visualization.title}</Text>
                        <IconButton
                          size="sm"
                          onClick={() => removeVisualization(visualization.id)}
                          aria-label="시각화 제거"
                          colorScheme="red"
                          variant="ghost"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </HStack>
                      
                      <VStack gap={2} align="stretch">
                        <Field.Root>
                          <Field.Label fontSize="sm">제목</Field.Label>
                          <Input
                            size="sm"
                            value={visualization.title}
                            onChange={(e) => updateVisualization(visualization.id, { title: e.target.value })}
                          />
                        </Field.Root>
                        
                        <Field.Root>
                          <Field.Label fontSize="sm">시각화 타입</Field.Label>
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
                            <option value="number">숫자</option>
                            <option value="gauge">게이지</option>
                            <option value="lineChart">차트</option>
                            <option value="text">텍스트</option>
                            <option value="json">JSON</option>
                          </select>
                        </Field.Root>
                        
                        <Field.Root>
                          <Field.Label fontSize="sm">데이터 필드 경로</Field.Label>
                          <Input
                            size="sm"
                            value={visualization.dataMapping.fieldPath}
                            onChange={(e) => updateVisualization(visualization.id, { 
                              dataMapping: { ...visualization.dataMapping, fieldPath: e.target.value }
                            })}
                            placeholder="예: motor_state[0].q, power_v"
                          />
                        </Field.Root>
                        
                        <Field.Root>
                          <Field.Label fontSize="sm">라벨</Field.Label>
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
                          <Field.Label fontSize="sm">단위</Field.Label>
                          <Input
                            size="sm"
                            value={visualization.dataMapping.unit || ''}
                            onChange={(e) => updateVisualization(visualization.id, { 
                              dataMapping: { ...visualization.dataMapping, unit: e.target.value }
                            })}
                            placeholder="예: V, A, rad/s"
                          />
                        </Field.Root>
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