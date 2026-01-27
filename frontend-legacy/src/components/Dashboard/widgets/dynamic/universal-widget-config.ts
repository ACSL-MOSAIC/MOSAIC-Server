// 범용 위젯 설정 인터페이스
export type VisualizationType =
  | "chart"
  | "lineChart"
  | "barChart"
  | "scatterChart"
  | "areaChart"
  | "gauge"
  | "text"
  | "number"
  | "json"

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
  chartType: "line" | "bar" | "scatter" | "area"
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
  size?: "small" | "medium" | "large"
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
  layout?: "grid" | "vertical" | "horizontal"
}
