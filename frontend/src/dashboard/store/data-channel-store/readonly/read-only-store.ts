import { DataStore } from "../../store"

export abstract class ReadOnlyStore<T, I = string> extends DataStore<T, I> {
    protected dataChannel: RTCDataChannel | null = null

    constructor(robotId: string, maxSize: number = 1000, parser: (data: I) => T | null) {
        super(robotId, maxSize, parser)
    }

    // Set data channel
    public setDataChannel(channel: RTCDataChannel): void {
        this.dataChannel = channel
        console.log(`ReadOnlyStore[${this.robotId}] data channel set:`, channel.label)
    }

    // Get data channel
    public getDataChannel(): RTCDataChannel | null {
        return this.dataChannel
    }

    // Check data channel connection status
    public isChannelConnected(): boolean {
        return this.dataChannel?.readyState === 'open'
    }

    // Clean up data channel
    public cleanupDataChannel(): void {
        if (this.dataChannel) {
            this.dataChannel = null
            console.log(`ReadOnlyStore[${this.robotId}] data channel cleaned up`)
        }
    }

    // Get data channel state information
    public getChannelInfo(): { connected: boolean; label?: string; state?: string } {
        return {
            connected: this.isChannelConnected(),
            label: this.dataChannel?.label,
            state: this.dataChannel?.readyState
        }
    }
} 