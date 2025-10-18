import type {VideoRecorderStore} from "@/dashboard/store/data-channel-store/writeonly/video-recorder.store.ts"
import {HStack, IconButton, VStack} from "@chakra-ui/react"
import {useEffect, useState} from "react"
import {
  MdFiberManualRecord,
  MdPause,
  MdPlayArrow,
  MdStop,
} from "react-icons/md"
import {WidgetFrame} from "../WidgetFrame"

enum RecordingState {
  NotRecording = "NotRecording",
  Recording = "Recording",
  Paused = "Paused",
}

interface VideoRecorderWidgetProps {
  robotId: string
  store: VideoRecorderStore
  dataType?: string
  onRemove?: () => void
}

const BaseIconButton = ({
                          children,
                          onClick,
                          disabled,
                        }: {
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) => {
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      size="2xl"
      borderRadius="md"
      boxShadow="md"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: "lg",
      }}
      _active={{
        transform: "translateY(0px)",
        boxShadow: "sm",
      }}
      transition="all 0.2s"
      minH="50px"
    >
      {children}
    </IconButton>
  )
}

export function VideoRecordingWidget({
                                       robotId,
                                       store,
                                       onRemove,
                                     }: VideoRecorderWidgetProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>(
    RecordingState.NotRecording,
  )

  useEffect(() => {
    // WebRTC 연결 상태 확인
    const checkConnectionStatus = () => {
      const dataChannel = store.getDataChannel()

      if (dataChannel && dataChannel.readyState === "open") {
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    }

    // 초기 상태 확인
    checkConnectionStatus()

    // 실시간 연결 상태 변경 리스너 등록
    const unsubscribeConnection = store.onConnectionStateChange((connected) => {
      setIsConnected(connected)
    })

    return () => {
      // console.log(`VideoRecordingWidget - cleanup for robot ${robotId}`)
      unsubscribeConnection()
    }
  }, [store, robotId])

  const handleRecordStart = () => {
    if (recordingState === RecordingState.NotRecording) {
      const sent = store.sendCommand("start")
      if (sent) {
        setRecordingState(RecordingState.Recording)
        console.log("녹화 시작 명령 전송 완료")
      } else {
        console.warn("녹화 시작 명령 전송 실패")
      }
    }
  }

  const handleRecordStop = () => {
    if (
      recordingState === RecordingState.Recording ||
      recordingState === RecordingState.Paused
    ) {
      const sent = store.sendCommand("stop")
      if (sent) {
        setRecordingState(RecordingState.NotRecording)
        console.log("녹화 중지 명령 전송 완료")
      } else {
        console.warn("녹화 중지 명령 전송 실패")
      }
    }
  }

  const handleRecordPause = () => {
    if (recordingState === RecordingState.Recording) {
      const sent = store.sendCommand("pause")
      if (sent) {
        setRecordingState(RecordingState.Paused)
        console.log("녹화 일시 정지 명령 전송 완료")
      } else {
        console.warn("녹화 일시 정지 명령 전송 실패")
      }
    }
  }

  const handleRecordResume = () => {
    if (recordingState === RecordingState.Paused) {
      const sent = store.sendCommand("resume")
      if (sent) {
        setRecordingState(RecordingState.Recording)
        console.log("녹화 재개 명령 전송 완료")
      } else {
        console.warn("녹화 재개 명령 전송 실패")
      }
    }
  }

  const recordingStatusMap = {
    [RecordingState.Recording]: "Recording...",
    [RecordingState.Paused]: "Paused...",
    [RecordingState.NotRecording]: "Ready to Recording...",
  }

  const footerInfo = [
    {label: "Recording Status", value: recordingStatusMap[recordingState]},
  ]

  return (
    <WidgetFrame
      title="Video Recorder"
      robot_id={robotId}
      isConnected={isConnected}
      footerInfo={footerInfo}
      footerMessage={
        isConnected ? "Ready to send commands" : "Waiting for connection..."
      }
      padding="4"
      onRemove={onRemove}
    >
      <VStack gap={4} align="center" h="100%" justify="center">
        <HStack gap={4} justify="center" w="100%">
          {/* 녹화 시 버튼 */}
          <BaseIconButton
            onClick={handleRecordStart}
            disabled={
              recordingState !== RecordingState.NotRecording || !isConnected
            }
          >
            <MdFiberManualRecord/>
          </BaseIconButton>
          {/* 녹화 중지 버튼 */}
          <BaseIconButton
            onClick={handleRecordStop}
            disabled={
              recordingState === RecordingState.NotRecording || !isConnected
            }
          >
            <MdStop/>
          </BaseIconButton>
          {/* 녹화 일시 정지 버튼 */}
          <BaseIconButton
            onClick={handleRecordPause}
            disabled={
              recordingState !== RecordingState.Recording || !isConnected
            }
          >
            <MdPause/>
          </BaseIconButton>
          {/* 녹화 재개 버튼 */}
          <BaseIconButton
            onClick={handleRecordResume}
            disabled={recordingState !== RecordingState.Paused || !isConnected}
          >
            <MdPlayArrow/>
          </BaseIconButton>
        </HStack>
      </VStack>
    </WidgetFrame>
  )
}
