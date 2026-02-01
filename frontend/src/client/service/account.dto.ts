export type AccountLoginReqDto = {
  username: string
  password: string
}

export type AccountLoginResDto = {
  accessToken: string
  existingConnection: boolean
}

export type AccountSignupDto = {
  email: string
  password: string
  fullName: string
}
