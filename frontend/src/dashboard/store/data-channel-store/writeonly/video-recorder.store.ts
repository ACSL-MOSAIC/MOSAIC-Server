import {
  type ParsedVideoRecordingCommand,
  type VideoRecordingCommandType,
  parseVideoRecordingCommand,
} from "@/dashboard/parser/video-recorder.ts"
import {WriteOnlyStore} from "./write-only-store"

export class VideoRecorderStore extends WriteOnlyStore<ParsedVideoRecordingCommand> {
  constructor(robotId: string, maxSize = 10) {
    super(robotId, maxSize, parseVideoRecordingCommand)
  }

  public sendCommand(command: VideoRecordingCommandType): boolean {
    const command_data = {
      command: command,
      timestamp: Date.now(),
    }

    const command_str = JSON.stringify(command_data)

    // Add to store (for internal processing)
    this.add(command_str)

    // Send via WebRTC channel
    return this.sendDataIfConnected(command_str)
  }

  // Abstract method implementation: send data
  protected sendData(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(data)
      console.log(
        `Video Recording command sent: ${data} -> ${this.dataChannel.label}`,
      )
    }
  }
}
