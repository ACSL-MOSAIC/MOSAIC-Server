import React, { useEffect, useState, useRef } from 'react'
import { Box, Text, Flex, Grid, GridItem, TabsRoot, TabsList, TabsContent, TabsTrigger } from "@chakra-ui/react"
import { WidgetProps } from './types'
import { ParsedGo2LowState } from '../../../dashboard/parser/go2-low-state'
import { Go2LowStateStore } from '../../../dashboard/store/go2-low-state.store'
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export interface Go2LowStateWidgetProps extends WidgetProps {
  store: Go2LowStateStore;
}

const MAX_DATA_POINTS = 50

export function Go2LowStateWidget({ robotId, store }: Go2LowStateWidgetProps) {

  const [data, setData] = useState<ParsedGo2LowState | null>(null)
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  }>({
    labels: [],
    datasets: [
      {
        label: 'Motor 0 Q',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Motor 1 Q',
        data: [],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  })

  useEffect(() => {
      const unsubscribe = store.subscribe((newData) => {
        console.log("newData", newData)
      setData(newData)
      
      // Update chart data
      setChartData(prev => {
        const newLabels = [...prev.labels, new Date().toLocaleTimeString()]
        const newDatasets = prev.datasets.map((dataset, index) => ({
          ...dataset,
          data: [...dataset.data, newData.motor_state[index].q].slice(-MAX_DATA_POINTS)
        }))

        return {
          labels: newLabels.slice(-MAX_DATA_POINTS),
          datasets: newDatasets
        }
      })
    })

    return () => {
      unsubscribe()
    }
  }, [store])

  // 디버깅용 로그 추가
  useEffect(() => {
    console.log('Go2LowStateWidget data:', data)
    console.log('Go2LowStateWidget chartData:', chartData)
  }, [data, chartData])

  if (!data) {
    return (
      <Box className="bg-white rounded-lg p-4 h-full">
        <Text>Loading...</Text>
      </Box>
    )
  }

  return (
    <Box className="bg-white rounded-lg p-4 h-full">
      <TabsRoot defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">차트</TabsTrigger>
          <TabsTrigger value="details">상세 정보</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Box height="300px">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 0
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </Box>
        </TabsContent>

        <TabsContent value="details">
          <Flex direction="column" gap={4}>
            <Text fontSize="lg" fontWeight="bold">Go2 Low State</Text>
            
            {/* IMU State */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={2}>IMU State</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Text fontSize="sm" color="gray.600">Quaternion</Text>
                  <Text fontSize="sm">
                    {data.imu_state.quaternion.map((q, i) => q.toFixed(3)).join(', ')}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="sm" color="gray.600">Gyroscope</Text>
                  <Text fontSize="sm">
                    {data.imu_state.gyroscope.map((g, i) => g.toFixed(3)).join(', ')}
                  </Text>
                </GridItem>
              </Grid>
            </Box>

            {/* Motor State */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={2}>Motor State</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                {data.motor_state.map((motor, index) => (
                  <GridItem key={index}>
                    <Text fontSize="sm" color="gray.600">Motor {index}</Text>
                    <Text fontSize="sm">Q: {motor.q.toFixed(3)}</Text>
                    <Text fontSize="sm">DQ: {motor.dq.toFixed(3)}</Text>
                    <Text fontSize="sm">Torque: {motor.tau_est.toFixed(3)}</Text>
                  </GridItem>
                ))}
              </Grid>
            </Box>

            {/* Foot Force */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={2}>Foot Force</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Text fontSize="sm" color="gray.600">Measured</Text>
                  <Text fontSize="sm">
                    {data.foot_force.map((f, i) => f.toFixed(3)).join(', ')}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="sm" color="gray.600">Estimated</Text>
                  <Text fontSize="sm">
                    {data.foot_force_est.map((f, i) => f.toFixed(3)).join(', ')}
                  </Text>
                </GridItem>
              </Grid>
            </Box>

            {/* Power */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={2}>Power</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <GridItem>
                  <Text fontSize="sm" color="gray.600">Voltage</Text>
                  <Text fontSize="sm">{data.power_v.toFixed(2)}V</Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="sm" color="gray.600">Current</Text>
                  <Text fontSize="sm">{data.power_a.toFixed(2)}A</Text>
                </GridItem>
              </Grid>
            </Box>
          </Flex>
        </TabsContent>
      </TabsRoot>
    </Box>
  )
} 