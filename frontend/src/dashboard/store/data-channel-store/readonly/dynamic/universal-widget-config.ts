// 범용 위젯 설정 인터페이스
export type VisualizationType = 'lineChart' | 'gauge' | 'text' | 'number' | 'json'

// 데이터 소스 설정
export interface DataSourceConfig {
  robotId: string
  dataType: string // 기존 스토어 타입 (예: 'go2_low_state', 'turtlesim_position')
  channelLabel?: string
}

// 데이터 필드 매핑
export interface DataFieldMapping {
  fieldPath: string // JSON 경로 (예: "motor_state[0].q", "power_v")
  label?: string
  color?: string
  unit?: string
}

// 시각화 설정
export interface VisualizationConfig {
  id: string
  type: VisualizationType
  title: string
  dataSourceIndex: number // DataSourceConfig 배열의 인덱스
  dataMapping: DataFieldMapping
  options?: any // 시각화별 옵션
}

// 범용 위젯 설정
export interface UniversalWidgetConfig {
  id: string
  title: string
  dataSources: DataSourceConfig[]
  visualizations: VisualizationConfig[]
  layout?: 'grid' | 'vertical' | 'horizontal'
}

// 위젯 설정 유틸리티
export const UniversalWidgetConfigUtils = {
  // 기본 설정 생성
  createDefaultConfig(robotId: string): UniversalWidgetConfig {
    return {
      id: `universal_${Date.now()}`,
      title: 'Universal Widget',
      dataSources: [],
      visualizations: [],
      layout: 'grid'
    }
  },

  // 데이터 소스 추가
  addDataSource(config: UniversalWidgetConfig, dataSource: DataSourceConfig): UniversalWidgetConfig {
    return {
      ...config,
      dataSources: [...config.dataSources, dataSource]
    }
  },

  // 시각화 추가
  addVisualization(config: UniversalWidgetConfig, visualization: VisualizationConfig): UniversalWidgetConfig {
    return {
      ...config,
      visualizations: [...config.visualizations, visualization]
    }
  },

  // 시각화 제거
  removeVisualization(config: UniversalWidgetConfig, visualizationId: string): UniversalWidgetConfig {
    return {
      ...config,
      visualizations: config.visualizations.filter(v => v.id !== visualizationId)
    }
  },

  // 데이터 소스 제거
  removeDataSource(config: UniversalWidgetConfig, dataSourceIndex: number): UniversalWidgetConfig {
    const newDataSources = config.dataSources.filter((_, index) => index !== dataSourceIndex)
    const newVisualizations = config.visualizations.filter(v => v.dataSourceIndex !== dataSourceIndex)
    
    // 인덱스 재조정
    const adjustedVisualizations = newVisualizations.map(v => ({
      ...v,
      dataSourceIndex: v.dataSourceIndex > dataSourceIndex ? v.dataSourceIndex - 1 : v.dataSourceIndex
    }))
    
    return {
      ...config,
      dataSources: newDataSources,
      visualizations: adjustedVisualizations
    }
  }
} 