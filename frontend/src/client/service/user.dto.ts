export type UserDto = {
  id: string
  email: string
  isActive: boolean
  isOrganizationAdmin: boolean
  fullName: string
  createdAt: string
  updatedAt: string
}

export type UserUpdateMeDto = {
  fullName: string
}

export type UserUpdatePasswordMeDto = {
  currentPassword: string
  newPassword: string
}
