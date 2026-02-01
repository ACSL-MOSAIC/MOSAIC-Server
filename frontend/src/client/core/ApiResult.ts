export type ApiResult<TData = any> = {
  readonly resultData: TData
  readonly resultCode: number
  readonly ok: boolean
  readonly status: number
  readonly statusText: string
  readonly url: string
}
