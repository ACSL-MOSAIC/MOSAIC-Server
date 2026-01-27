export type DynamicTypeConfigCreate = {
  configuration?: Array<{
    [key: string]: unknown
  }>
}

export type DynamicTypeConfigPublic = {
  configuration?: Array<{
    [key: string]: unknown
  }>
  id: number
  user_id: string
}
