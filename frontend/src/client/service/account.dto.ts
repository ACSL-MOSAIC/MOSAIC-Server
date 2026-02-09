export type AccountLoginReqDto = {
  username: string
  password: string
}

export type AccountLoginResDto = {
  accessToken: string
  existingConnection: boolean
}

export type OrganizationLoginReqDto = {
  username: string
  password: string
  organizationName: string
}

export type OrganizationLoginResDto = {
  accessToken: string
  existingConnection: boolean
}

export type AccountSignupDto = {
  email: string
  password: string
  fullName: string
}
