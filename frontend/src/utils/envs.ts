const env = import.meta.env

export const getEnvironment = () => {
  return env.VITE_ENVIRONMENT ? env.VITE_ENVIRONMENT : "local"
}

export const getBackendUrl = () => {
  return env.VITE_API_URL ? env.VITE_API_URL : "http://localhost:9001"
}

export const getBackendWsUrl = () => {
  return env.VITE_WS_URL ? env.VITE_WS_URL : "ws://localhost:9001"
}
