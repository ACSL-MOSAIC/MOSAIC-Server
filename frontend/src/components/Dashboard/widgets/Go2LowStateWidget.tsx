import React, { useEffect, useState } from 'react'
import { Box, Text, Flex, Grid, GridItem } from "@chakra-ui/react"
import { WidgetProps } from './types'
import { ParsedGo2LowState } from '../../../dashboard/parser/go2-low-state'
import { Go2LowStateStore } from '../../../dashboard/store/go2-low-state.store'

export interface Go2LowStateWidgetProps extends WidgetProps {
  store: Go2LowStateStore;
}

export function Go2LowStateWidget({ robotId, store }: Go2LowStateWidgetProps) {
  const [data, setData] = useState<ParsedGo2LowState | null>(null)

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = store.subscribe((newData) => {
      setData(newData)
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [store])

  if (!data) {
    return (
      <Box className="bg-white rounded-lg p-4 h-full">
        <Text>Loading...</Text>
      </Box>
    )
  }

  return (
    <Box className="bg-white rounded-lg p-4 h-full">
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
    </Box>
  )
} 