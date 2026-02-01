export type MessageDto = {
  message: string
}

export type PageDto<T> = {
  data: Array<T>
  count: number
}
