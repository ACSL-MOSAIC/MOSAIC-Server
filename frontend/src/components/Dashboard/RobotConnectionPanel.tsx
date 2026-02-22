import { useRobotInfo } from "@/hooks/useRobotInfo.ts"
import type { RobotInfo } from "@/mosaic/robot-info.ts"
import { Badge, Box, Button, Flex, Grid, Icon, Text } from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { IoPower, IoPowerOutline } from "react-icons/io5"

interface RobotConnectionPanelProps {
  onConnect: (robotId: string) => void
  onDisconnect: (robotId: string) => void
  onConnectAll: () => void
  onDisconnectAll: () => void
}

function RobotConnectionPanel({
  onConnect,
  onDisconnect,
  onConnectAll,
  onDisconnectAll,
}: RobotConnectionPanelProps) {
  const { robotInfos } = useRobotInfo()

  const readyRobots = useMemo(
    () =>
      robotInfos.filter((robotInfo) => {
        return robotInfo.isReadyToConnect
      }),
    [robotInfos],
  )
  const connectedRobots = useMemo(
    () =>
      robotInfos.filter((robotInfo) => {
        return robotInfo.isRtcConnected
      }),
    [robotInfos],
  )

  const getStatusColor = useCallback((robotInfo: RobotInfo) => {
    if (robotInfo.isRtcConnected) {
      return "green"
    }
    if (robotInfo.isReadyToConnect) {
      return "blue"
    }
    return "gray"
  }, [])

  if (robotInfos.length === 0) {
    return (
      <Box textAlign="center" py={4} bg="gray.50" borderRadius="lg">
        <Text fontSize="lg" color="gray.500">
          No robots available for connection.
        </Text>
      </Box>
    )
  }

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="md" mb={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="gray.700">
            Robot Connection Management
          </Text>
          <Text fontSize="sm" color="gray.500">
            {connectedRobots.length} of {robotInfos.length} robots connected
          </Text>
        </Box>
        <Flex gap={2}>
          <Button
            colorScheme="green"
            size="sm"
            onClick={onConnectAll}
            disabled={readyRobots.length === 0}
          >
            <Icon as={IoPower} mr={2} />
            Connect All
          </Button>
          <Button
            colorScheme="red"
            size="sm"
            onClick={onDisconnectAll}
            disabled={connectedRobots.length === 0}
          >
            <Icon as={IoPowerOutline} mr={2} />
            Disconnect All
          </Button>
        </Flex>
      </Flex>

      {/* Robot list */}
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(3, 1fr)",
          lg: "repeat(6, 1fr)",
        }}
        gap={4}
      >
        {robotInfos.map((robotInfo) => {
          return (
            <Box
              key={robotInfo.id}
              p={4}
              bg={robotInfo.isRtcConnected ? "green.50" : "gray.50"}
              borderRadius="lg"
              borderWidth={2}
              borderColor={robotInfo.isRtcConnected ? "green.200" : "gray.200"}
              transition="all 0.2s"
              _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="bold" fontSize="lg">
                  {robotInfo.name}
                </Text>
                <Badge colorScheme={getStatusColor(robotInfo)}>
                  {robotInfo.statusString}
                </Badge>
              </Flex>

              <Flex gap={2} align="center">
                {robotInfo.isRtcConnected ? (
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => onDisconnect(robotInfo.id)}
                    flex="1"
                  >
                    <Icon as={IoPowerOutline} mr={2} />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => onConnect(robotInfo.id)}
                    disabled={!robotInfo.isReadyToConnect}
                    flex="1"
                  >
                    <Icon as={IoPowerOutline} mr={2} />
                    Connect
                  </Button>
                )}
              </Flex>
            </Box>
          )
        })}
      </Grid>
    </Box>
  )
}

export default RobotConnectionPanel
