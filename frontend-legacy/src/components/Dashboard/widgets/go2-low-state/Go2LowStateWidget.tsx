import type {
  Go2ImuStateData,
  ParsedGo2LowState,
} from "@/dashboard/parser/go2-low-state.ts"
import type {Go2LowStateStore} from "@/dashboard/store/data-channel-store/readonly/go2-low-state.store.ts"
import {
  Box,
  Flex,
  Grid,
  GridItem,
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  Text,
} from "@chakra-ui/react"
import {
  Cone,
  GizmoHelper,
  GizmoViewport,
  OrbitControls,
  Box as ThreeBox,
  Grid as ThreeGrid,
} from "@react-three/drei"
import {Canvas} from "@react-three/fiber"
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import {useEffect, useState} from "react"
import {Line} from "react-chartjs-2"
import * as THREE from "three"
import {WidgetFrame} from "../WidgetFrame"
import type {WidgetProps} from "../types"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

export interface Go2LowStateWidgetProps extends WidgetProps {
  store: Go2LowStateStore
}

const MAX_DATA_POINTS = 100

// IMU 시각화 컴포넌트
function IMUVisualizer({imuState}: { imuState: Go2ImuStateData }) {
  const threeQuaternion = new THREE.Quaternion(
    imuState.quaternion[1], // x
    imuState.quaternion[2], // y
    imuState.quaternion[3], // z
    imuState.quaternion[0], // w
  )

  // 데이터가 변경될 때마다 쿼터니언 업데이트
  useEffect(() => {
    threeQuaternion.set(
      imuState.quaternion[1], // x
      imuState.quaternion[2], // y
      imuState.quaternion[3], // z
      imuState.quaternion[0], // w
    )
  }, [imuState.quaternion])

  return (
    <Canvas camera={{position: [3, 3, 3], fov: 50}}>
      <color attach="background" args={["#f0f0f0"]}/>
      <ambientLight intensity={0.5}/>
      <pointLight position={[10, 10, 10]} intensity={1}/>
      <pointLight position={[-10, -10, -10]} intensity={0.5}/>

      {/* 좌표계 그리드 */}
      <ThreeGrid
        args={[10, 10]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {/* 로봇 본체 (큐브) */}
      <ThreeBox
        args={[0.8, 2, 0.4]}
        quaternion={threeQuaternion}
        position={[0, 1, 0]}
      >
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.3}
          roughness={0.4}
          wireframe={false}
        />
      </ThreeBox>
      {/* 엣지 강조를 위한 wireframe */}
      <ThreeBox
        args={[0.8, 2, 0.4]}
        quaternion={threeQuaternion}
        position={[0, 1, 0]}
      >
        <meshBasicMaterial
          color="#000000"
          wireframe={true}
          transparent={true}
          opacity={0.3}
        />
      </ThreeBox>

      {/* 방향 표시 화살표 */}
      <group quaternion={threeQuaternion} position={[0, 1, 0.6]}>
        {/* 화살표 몸통 */}
        <Cone
          args={[0.08, 0.25, 8]}
          rotation={[Math.PI, 0, 0]}
          position={[0, 0, 0.15]}
        >
          <meshStandardMaterial
            color="#ff4d4d"
            metalness={0.3}
            roughness={0.4}
          />
        </Cone>
      </group>

      {/* 좌표축 표시 */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          labelColor="black"
          axisColors={["#ff0000", "#00ff00", "#0000ff"]}
        />
      </GizmoHelper>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={10}
      />
    </Canvas>
  )
}

export function Go2LowStateWidget({
                                    robotId,
                                    store,
                                    dataType,
                                    onRemove,
                                  }: Go2LowStateWidgetProps) {
  const [data, setData] = useState<ParsedGo2LowState | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [motorHistory, setMotorHistory] = useState<{
    labels: string[]
    values: number[][][]
  }>({labels: [], values: Array(12).fill([[], [], [], []])})
  // values: [모터][Q, DQ, Torque, DDQ][시간]
  const [footForceHistory, setFootForceHistory] = useState<{
    labels: string[]
    values: number[][]
  }>({labels: [], values: Array(4).fill([])})
  const [powerHistory, setPowerHistory] = useState<{
    labels: string[]
    values: number[][]
  }>({labels: [], values: [[], []]})

  useEffect(() => {
    const unsubscribe = store.subscribe((newData) => {
      setData(newData)
      setIsConnected(true)
      const timeLabel = new Date(newData.timestamp).toLocaleTimeString()
      // 모터
      setMotorHistory((prev) => {
        const newLabels = [...prev.labels, timeLabel].slice(-MAX_DATA_POINTS)
        const newValues = prev.values.map((arr, i) => [
          [...(arr[0] || []), newData.motor_state[i]?.q ?? 0].slice(
            -MAX_DATA_POINTS,
          ),
          [...(arr[1] || []), newData.motor_state[i]?.dq ?? 0].slice(
            -MAX_DATA_POINTS,
          ),
          [...(arr[2] || []), newData.motor_state[i]?.tau_est ?? 0].slice(
            -MAX_DATA_POINTS,
          ),
          [...(arr[3] || []), newData.motor_state[i]?.ddq ?? 0].slice(
            -MAX_DATA_POINTS,
          ),
        ])
        return {labels: newLabels, values: newValues}
      })
      // FootForce
      setFootForceHistory((prev) => {
        const newLabels = [...prev.labels, timeLabel].slice(-MAX_DATA_POINTS)
        const newValues = prev.values.map((arr, i) =>
          [...arr, newData.foot_force[i] ?? 0].slice(-MAX_DATA_POINTS),
        )
        return {labels: newLabels, values: newValues}
      })
      // Power
      setPowerHistory((prev) => {
        const newLabels = [...prev.labels, timeLabel].slice(-MAX_DATA_POINTS)
        const newValues = [
          [...prev.values[0], newData.power_v].slice(-MAX_DATA_POINTS),
          [...prev.values[1], newData.power_a].slice(-MAX_DATA_POINTS),
        ]
        return {labels: newLabels, values: newValues}
      })
    })
    return () => unsubscribe()
  }, [store])

  if (!data) {
    return (
      <WidgetFrame
        title="Go2 Low State"
        isConnected={false}
        footerMessage="Loading..."
        onRemove={onRemove}
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="100%"
          color="gray.500"
        >
          <Text>Loading...</Text>
        </Flex>
      </WidgetFrame>
    )
  }

  // 모터 차트 데이터 생성
  const motorCharts = motorHistory.values.map((motorData, motorIndex) => {
    const chartData = {
      labels: motorHistory.labels,
      datasets: [
        {
          label: "Q",
          data: motorData[0],
          borderColor: "#3182ce",
          backgroundColor: "rgba(49, 130, 206, 0.1)",
          tension: 0.4,
        },
        {
          label: "DQ",
          data: motorData[1],
          borderColor: "#38a169",
          backgroundColor: "rgba(56, 161, 105, 0.1)",
          tension: 0.4,
        },
        {
          label: "Torque",
          data: motorData[2],
          borderColor: "#e53e3e",
          backgroundColor: "rgba(229, 62, 62, 0.1)",
          tension: 0.4,
        },
        {
          label: "DDQ",
          data: motorData[3],
          borderColor: "#d69e2e",
          backgroundColor: "rgba(214, 158, 46, 0.1)",
          tension: 0.4,
        },
      ],
    }

    return (
      <GridItem key={motorIndex}>
        <Box p={2} border="1px solid" borderColor="gray.200" borderRadius="md">
          <Text fontSize="sm" fontWeight="bold" mb={2}>
            Motor {motorIndex}
          </Text>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: {duration: 0},
              scales: {y: {beginAtZero: true}},
              plugins: {legend: {display: false}},
            }}
            height={150}
          />
        </Box>
      </GridItem>
    )
  })

  // FootForce 차트 데이터
  const footForceChartData = {
    labels: footForceHistory.labels,
    datasets: footForceHistory.values.map((data, index) => ({
      label: `Foot ${index}`,
      data: data,
      borderColor: `hsl(${index * 90}, 70%, 50%)`,
      backgroundColor: `hsla(${index * 90}, 70%, 50%, 0.1)`,
      tension: 0.4,
    })),
  }

  // Power 차트 데이터
  const powerChartData = {
    labels: powerHistory.labels,
    datasets: [
      {
        label: "Voltage (V)",
        data: powerHistory.values[0],
        borderColor: "#3182ce",
        backgroundColor: "rgba(49, 130, 206, 0.1)",
        tension: 0.4,
      },
      {
        label: "Current (A)",
        data: powerHistory.values[1],
        borderColor: "#e53e3e",
        backgroundColor: "rgba(229, 62, 62, 0.1)",
        tension: 0.4,
      },
    ],
  }

  // Footer info
  const footerInfo = [
    {
      label: "Data Type",
      value: (dataType || "unknown").toUpperCase(),
    },
    {
      label: "Last Update",
      value: new Date(data.timestamp).toLocaleTimeString(),
    },
  ]

  return (
    <WidgetFrame
      title="Go2 Low State"
      robot_id={robotId}
      isConnected={isConnected}
      footerInfo={footerInfo}
      footerMessage={
        isConnected ? "Go2 Low State data active" : "Waiting for data..."
      }
      padding="4"
      onRemove={onRemove}
    >
      <TabsRoot
        defaultValue="motor"
        style={{display: "flex", flexDirection: "column", height: "100%"}}
      >
        <TabsList style={{flexShrink: 0}}>
          <TabsTrigger value="motor">Motor Charts</TabsTrigger>
          <TabsTrigger value="footforce">FootForce Charts</TabsTrigger>
          <TabsTrigger value="power">Power Charts</TabsTrigger>
          <TabsTrigger value="imu">IMU State</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* 탭 1: 모터 차트 (2열 6행 그리드) */}
        <TabsContent value="motor" style={{flex: 1, overflow: "auto"}}>
          <Box width="100%" height="100%">
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              {motorCharts}
            </Grid>
          </Box>
        </TabsContent>

        {/* 탭 2: FootForce 차트 */}
        <TabsContent value="footforce" style={{flex: 1, overflow: "auto"}}>
          <Box width="100%" height="100%">
            <Line
              data={footForceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: {duration: 0},
                scales: {y: {beginAtZero: true}},
              }}
            />
          </Box>
        </TabsContent>

        {/* 탭 3: Power 차트 */}
        <TabsContent value="power" style={{flex: 1, overflow: "auto"}}>
          <Box width="100%" height="100%">
            <Line
              data={powerChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: {duration: 0},
                scales: {y: {beginAtZero: true}},
              }}
            />
          </Box>
        </TabsContent>

        {/* 탭 4: IMU State */}
        <TabsContent value="imu" style={{flex: 1, overflow: "auto"}}>
          <Box width="100%" height="100%" position="relative">
            {data && <IMUVisualizer imuState={data.imu_state}/>}
            <Box
              position="absolute"
              bottom={4}
              left={4}
              bg="white"
              p={2}
              borderRadius="md"
              boxShadow="sm"
            >
              <Text fontSize="sm" fontWeight="bold">
                IMU State
              </Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                <GridItem>
                  <Text fontSize="xs" fontWeight="semibold">
                    Quaternion (w, x, y, z):
                  </Text>
                  <Text fontSize="xs">
                    {data?.imu_state.quaternion
                      .map((v) => v.toFixed(3))
                      .join(", ")}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="xs" fontWeight="semibold">
                    RPY (rad):
                  </Text>
                  <Text fontSize="xs">
                    {data?.imu_state.rpy.map((v) => v.toFixed(3)).join(", ")}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="xs" fontWeight="semibold">
                    Gyroscope (rad/s):
                  </Text>
                  <Text fontSize="xs">
                    {data?.imu_state.gyroscope
                      .map((v) => v.toFixed(3))
                      .join(", ")}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text fontSize="xs" fontWeight="semibold">
                    Accelerometer (m/s²):
                  </Text>
                  <Text fontSize="xs">
                    {data?.imu_state.accelerometer
                      .map((v) => v.toFixed(3))
                      .join(", ")}
                  </Text>
                </GridItem>
              </Grid>
            </Box>
          </Box>
        </TabsContent>

        {/* 탭 5: 상세 정보 */}
        <TabsContent value="details" style={{flex: 1, overflow: "auto"}}>
          <Box height="100%">
            <Flex direction="column" gap={4}>
              <Text fontSize="lg" fontWeight="bold">
                Go2 Low State
              </Text>
              {/* IMU State */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={2}>
                  IMU State
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">
                      Quaternion
                    </Text>
                    <Text fontSize="sm">
                      {data.imu_state.quaternion
                        .map((q) => q.toFixed(3))
                        .join(", ")}
                    </Text>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">
                      Gyroscope
                    </Text>
                    <Text fontSize="sm">
                      {data.imu_state.gyroscope
                        .map((g) => g.toFixed(3))
                        .join(", ")}
                    </Text>
                  </GridItem>
                </Grid>
              </Box>
              {/* Motor State */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={2}>
                  Motor State
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  {data.motor_state.map((motor, index) => (
                    <GridItem key={index}>
                      <Text fontSize="sm" color="gray.600">
                        Motor {index}
                      </Text>
                      <Text fontSize="sm">Q: {motor.q.toFixed(3)}</Text>
                      <Text fontSize="sm">DQ: {motor.dq.toFixed(3)}</Text>
                      <Text fontSize="sm">
                        Torque: {motor.tau_est.toFixed(3)}
                      </Text>
                    </GridItem>
                  ))}
                </Grid>
              </Box>
              {/* Foot Force */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={2}>
                  Foot Force
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">
                      Measured
                    </Text>
                    <Text fontSize="sm">
                      {data.foot_force.map((f) => f.toFixed(3)).join(", ")}
                    </Text>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">
                      Estimated
                    </Text>
                    <Text fontSize="sm">
                      {data.foot_force_est.map((f) => f.toFixed(3)).join(", ")}
                    </Text>
                  </GridItem>
                </Grid>
              </Box>
              {/* Power */}
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={2}>
                  Power
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">
                      Voltage
                    </Text>
                    <Text fontSize="sm">{data.power_v.toFixed(2)}V</Text>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="sm" color="gray.600">
                      Current
                    </Text>
                    <Text fontSize="sm">{data.power_a.toFixed(2)}A</Text>
                  </GridItem>
                </Grid>
              </Box>
            </Flex>
          </Box>
        </TabsContent>
      </TabsRoot>
    </WidgetFrame>
  )
}
