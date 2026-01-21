import YAML from "yaml"

export type YamlMapData = {
  image: string
  mode: string
  resolution: number
  origin: number[]
  negate: number
  free_thresh: number
  occupied_thresh: number
}

const parseYamlFile = async (file: File): Promise<any> => {
  try {
    const data = await file.text()
    return YAML.parse(data)
  } catch (error) {
    alert("Failed to load YAML file. Please check the file format.")
    console.error("Error parsing YAML file:", error)
  }
}

export const loadYamlMap = async (yamlFile: File): Promise<YamlMapData> => {
  const yamlContent = await parseYamlFile(yamlFile)
  return {
    image: yamlContent.image,
    mode: yamlContent.mode,
    resolution: yamlContent.resolution,
    origin: yamlContent.origin,
    negate: yamlContent.negate,
    free_thresh: yamlContent.free_thresh,
    occupied_thresh: yamlContent.occupied_thresh,
  }
}
