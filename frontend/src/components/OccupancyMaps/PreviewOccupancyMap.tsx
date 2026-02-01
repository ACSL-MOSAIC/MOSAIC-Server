import {
  Box,
  Button,
  Code,
  DialogTitle,
  Flex,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import {useCallback, useEffect, useRef, useState} from "react"
import {FiEye} from "react-icons/fi"

import {
  getOccupancyMapPgmApi,
  getOccupancyMapYamlApi,
} from "@/client/service/occupancy-map.api.ts"
import type {OccupancyMapDto} from "@/client/service/occupancy-map.dto.ts"
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog"
import useCustomToast from "@/hooks/useCustomToast"
import {type PgmMapData, loadPgmMap} from "@/utils/load-pgm-map.ts"
import {type YamlMapData, loadYamlMap} from "@/utils/load-yaml-map.ts"

interface PreviewOccupancyMapProps {
  occupancyMap: OccupancyMapDto
}

const PreviewOccupancyMap = ({occupancyMap}: PreviewOccupancyMapProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pgmMapData, setPgmMapData] = useState<PgmMapData | null>(null)
  const [yamlMapData, setYamlMapData] = useState<YamlMapData | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {showErrorToast} = useCustomToast()

  const loadMapData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pgmBlob, yamlBlob] = await Promise.all([
        getOccupancyMapPgmApi(occupancyMap.id),
        getOccupancyMapYamlApi(occupancyMap.id),
      ])

      // Convert Blob to File
      const pgmFile = new File([pgmBlob], "map.pgm", {
        type: "application/octet-stream",
      })
      const yamlFile = new File([yamlBlob], "map.yaml", {
        type: "application/x-yaml",
      })

      // Parse files
      const [parsedPgmData, parsedYamlData] = await Promise.all([
        loadPgmMap(pgmFile),
        loadYamlMap(yamlFile),
      ])

      setPgmMapData(parsedPgmData)
      setYamlMapData(parsedYamlData)
    } catch (error) {
      console.error("Failed to load map data:", error)
      showErrorToast("Failed to load map data")
    } finally {
      setIsLoading(false)
    }
  }, [occupancyMap.id, showErrorToast])

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !pgmMapData) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match PGM dimensions
    canvas.width = pgmMapData.width
    canvas.height = pgmMapData.height

    // Create image data
    const imageData = ctx.createImageData(pgmMapData.width, pgmMapData.height)
    const pixels = imageData.data

    // Convert grayscale PGM data to RGBA
    for (let i = 0; i < pgmMapData.data.length; i++) {
      const value = pgmMapData.data[i]
      const pixelIndex = i * 4
      pixels[pixelIndex] = value // R
      pixels[pixelIndex + 1] = value // G
      pixels[pixelIndex + 2] = value // B
      pixels[pixelIndex + 3] = 255 // A
    }

    ctx.putImageData(imageData, 0, 0)
  }, [pgmMapData])

  useEffect(() => {
    if (isOpen && !pgmMapData && !isLoading) {
      loadMapData()
    }
  }, [isOpen, pgmMapData, isLoading, loadMapData])

  useEffect(() => {
    if (pgmMapData) {
      drawMap()
    }
  }, [pgmMapData, drawMap])

  return (
    <DialogRoot
      size={{base: "md", md: "lg"}}
      placement="center"
      open={isOpen}
      onOpenChange={({open}) => {
        setIsOpen(open)
        if (!open) {
          setPgmMapData(null)
          setYamlMapData(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FiEye/>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preview: {occupancyMap.name}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <Flex justifyContent="center" alignItems="center" minH="300px">
              <Spinner size="xl"/>
            </Flex>
          ) : (
            <VStack gap={4} alignItems="stretch">
              {/* PGM Preview */}
              <Box>
                <Text fontWeight="bold" mb={2}>
                  Map Image (PGM)
                </Text>
                <Box
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  overflow="hidden"
                  maxH="400px"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  bg="gray.50"
                >
                  {pgmMapData ? (
                    <canvas
                      ref={canvasRef}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "400px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Text color="gray.500">No map data</Text>
                  )}
                </Box>
              </Box>

              {/* YAML Info */}
              {yamlMapData && (
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Map Configuration (YAML)
                  </Text>
                  <Code
                    display="block"
                    p={3}
                    borderRadius="md"
                    whiteSpace="pre-wrap"
                  >
                    {`image: ${yamlMapData.image}
mode: ${yamlMapData.mode}
resolution: ${yamlMapData.resolution}
origin: [${yamlMapData.origin.join(", ")}]
negate: ${yamlMapData.negate}
free_thresh: ${yamlMapData.free_thresh}
occupied_thresh: ${yamlMapData.occupied_thresh}`}
                  </Code>
                </Box>
              )}
            </VStack>
          )}
        </DialogBody>

        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="subtle" colorPalette="gray">
              Close
            </Button>
          </DialogActionTrigger>
        </DialogFooter>
        <DialogCloseTrigger/>
      </DialogContent>
    </DialogRoot>
  )
}

export default PreviewOccupancyMap
