export type MessageDto = {
  message: string
}

export type PageDto<T> = {
  data: Array<T>
  count: number
}

export type GlobalDto<T> = {
  resultCode: number
  resultData: T
}
