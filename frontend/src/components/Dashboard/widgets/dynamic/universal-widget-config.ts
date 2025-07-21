// 범용 위젯 설정 인터페이스
export type VisualizationType = 'chart' | 'lineChart' | 'barChart' | 'scatterChart' | 'areaChart' | 'gauge' | 'text' | 'number' | 'json'

// 차트 타입별 설정
export interface ChartAxisConfig {
  fieldPath: string
  label?: string
  color?: string
  unit?: string
  min?: number
  max?: number
  gridLines?: boolean
}

export interface ChartConfig {
  xAxis: ChartAxisConfig
  yAxes: ChartAxisConfig[]
  chartType: 'line' | 'bar' | 'scatter' | 'area'
  showLegend?: boolean
  showGrid?: boolean
  animation?: boolean
  tension?: number // 곡선 부드러움 (0-1)
  fillArea?: boolean // 영역 채우기 (area chart용)
  pointRadius?: number
  borderWidth?: number
}

// 게이지 설정
export interface GaugeConfig {
  min?: number
  max?: number
  thresholds?: {
    warning?: number
    critical?: number
  }
  colors?: {
    low?: string
    medium?: string
    high?: string
  }
  showValue?: boolean
  showUnit?: boolean
  animation?: boolean
  size?: 'small' | 'medium' | 'large'
}

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
  chartConfig?: ChartConfig // 차트 전용 설정
  gaugeConfig?: GaugeConfig // 게이지 전용 설정
  options?: any // 기타 시각화별 옵션
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

  // 기본 차트 설정 생성
  createDefaultChartConfig(): ChartConfig {
    return {
      xAxis: {
        fieldPath: 'timestamp',
        label: 'Time',
        gridLines: true
      },
      yAxes: [{
        fieldPath: '',
        label: 'Value',
        color: '#3182ce',
        gridLines: true
      }],
      chartType: 'line',
      showLegend: true,
      showGrid: true,
      animation: true,
      tension: 0.1,
      pointRadius: 3,
      borderWidth: 2
    }
  },

  // 기본 게이지 설정 생성
  createDefaultGaugeConfig(): GaugeConfig {
    return {
      min: 0,
      max: 100,
      thresholds: {
        warning: 70,
        critical: 90
      },
      colors: {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444'
      },
      showValue: true,
      showUnit: true,
      animation: true,
      size: 'medium'
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