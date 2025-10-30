export type OccupancyMapPublic = {
  id: string
  name: string
  pgm_file_path: string
  yaml_file_path: string
  created_at: string
  updated_at: string
}

export type OccupancyMapsPublic = {
  data: Array<OccupancyMapPublic>
  count: number
}
