declare module "react-gauge-chart" {
  import type { ComponentType } from "react"

  interface GaugeChartProps {
    id?: string
    nrOfLevels?: number
    percent?: number
    arcWidth?: number
    arcPadding?: number
    cornerRadius?: number
    colors?: string[]
    textColor?: string
    needleColor?: string
    needleBaseColor?: string
    hideText?: boolean
    animate?: boolean
    formatTextValue?: (value: number) => string
    className?: string
  }

  const GaugeChart: ComponentType<GaugeChartProps>
  export default GaugeChart
}
