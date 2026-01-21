export type DashboardCreate = {
  dashboard_config?: {
    [key: string]: unknown
  }
}

export type DashboardPublic = {
  dashboard_config?: {
    [key: string]: unknown
  }
  dashboard_id: string
  user_id: string
  created_at: string
  updated_at: string
}
