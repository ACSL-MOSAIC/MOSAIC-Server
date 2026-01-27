export type Body_users_login_access_token = {
  username: string
  password: string
}

export type DisconnectRequest = {
  user_id: string
}

export type NewPassword = {
  token: string
  new_password: string
}

export type PrivateUserCreate = {
  email: string
  password: string
  full_name: string
  is_verified?: boolean
}

export type LoginResponse = {
  accessToken: string
  existingConnection?: boolean
}

export type UpdatePassword = {
  current_password: string
  new_password: string
}

export type UserCreate = {
  email: string
  is_active?: boolean
  is_superuser?: boolean
  full_name?: string | null
  password: string
}

export type UserPublic = {
  email: string
  is_active?: boolean
  is_superuser?: boolean
  full_name?: string | null
  id: string
}

export type UserRegister = {
  email: string
  password: string
  full_name?: string | null
}

export type UsersPublic = {
  data: Array<UserPublic>
  count: number
}

export type UserUpdate = {
  email?: string | null
  is_active?: boolean
  is_superuser?: boolean
  full_name?: string | null
  password?: string | null
}
