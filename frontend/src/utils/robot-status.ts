export const convertRobotStatusToString = (status: number) => {
  if (status === 0) return "READY_TO_CONNECT"
  if (status === 1) return "RTC_CONNECTING"
  if (status === 2) return "RTC_CONNECTED"
  if (status === 3) return "RTC_DISCONNECTING"
  if (status === 4) return "RTC_FAILED"
  if (status === 5) return "DISCONNECTED"
  if (status === 6) return "WS_CONNECTED"
  return "Unknown"
}