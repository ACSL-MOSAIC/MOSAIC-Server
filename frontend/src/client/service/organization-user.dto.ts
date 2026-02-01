export type OrganizationCreateUserDto = {
  email: string
  password: string
  fullName: string
  isOrganizationAdmin: boolean
}

export type OrganizationUpdateUserDto = {
  id: string
  password?: string | null
  isActive?: boolean
  isOrganizationAdmin?: boolean
  fullName?: string | null
}

export type OrganizationDeleteUserDto = {
  id: string
}
