export type TabInfoDto = {
  id: string,
  name: string
}

export type TabAddDto = {
  name: string
}

export type TabConfigDto = {
  id: string,
  name: string,
  widgets: string,
}

export type TabNameUpdateDto = {
  name: string
}

export type TabConfigUpdateDto = {
  tabConfig: string
}
