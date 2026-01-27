import {
  type ParsedRemoteControl,
  parseRemoteControl,
} from "../../../parser/remote-control-pad.ts"
import {WriteOnlyStore} from "./write-only-store"

export class RemoteControlPadStore extends WriteOnlyStore<ParsedRemoteControl> {
  constructor(robotId: string, maxSize = 100) {
    super(robotId, maxSize, parseRemoteControl)
  }

  // Remote control command send method
  public sendCommand(
    direction: "up" | "down" | "left" | "right" | "stop",
  ): boolean {
    const command = {
      direction: direction,
      timestamp: Date.now(),
    }

    // Add to store (for internal processing)
    this.add(JSON.stringify(command))

    // Send via WebRTC channel
    return this.sendDataIfConnected(JSON.stringify(command))
  }

  // Abstract method implementation: send data
  protected sendData(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(data)
      console.log(
        `Remote control command sent: ${data} -> ${this.dataChannel.label}`,
      )
    }
  }
}
