import { WriteOnlyStore } from "./write-only-store"
import {
    ParsedVideoRecordingCommand,
    parseVideoRecordingCommand,
    VideoRecordingCommandType
} from "@/dashboard/parser/video-recorder.ts";

export class VideoRecorderStore extends WriteOnlyStore<ParsedVideoRecordingCommand> {
    constructor(robotId: string, maxSize: number = 10) {
        super(robotId, maxSize, parseVideoRecordingCommand)
    }

    public sendCommand(direction: VideoRecordingCommandType): boolean {
        const command = {
            direction: direction,
            timestamp: Date.now()
        }

        const command_str = JSON.stringify(command)
        
        // Add to store (for internal processing)
        this.add(command_str)
        
        // Send via WebRTC channel
        return this.sendDataIfConnected(command_str)
    }

    // Abstract method implementation: send data
    protected sendData(data: any): void {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(data)
            console.log(`Video Recording command sent: ${data} -> ${this.dataChannel.label}`)
        }
    }
} 