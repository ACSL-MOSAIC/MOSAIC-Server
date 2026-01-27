import {DataStore} from "../../store"

export abstract class WriteOnlyStore<T, I = string> extends DataStore<T, I> {
  protected dataChannel: RTCDataChannel | null = null
  private channelRequired = true // Write-only always needs a channel
  private connectionStateListeners: ((
    connected: boolean,
    state: string,
  ) => void)[] = []

  // Set data channel
  public setDataChannel(channel: RTCDataChannel): void {
    this.dataChannel = channel
    // console.log(
    //   `WriteOnlyStore[${this.robotId}] data channel set:`,
    //   channel.label,
    //   "state:",
    //   channel.readyState,
    // )

    // Setup DataChannel state change event listeners
    this.setupDataChannelEventListeners(channel)
  }

  // Setup DataChannel event listeners
  private setupDataChannelEventListeners(channel: RTCDataChannel): void {
    channel.onopen = () => {
      // console.log(
      //   `WriteOnlyStore[${this.robotId}] data channel opened:`,
      //   channel.label,
      //   "state:",
      //   channel.readyState,
      // )
      this.notifyConnectionStateChange(true, channel.readyState)
    }

    channel.onclose = () => {
      // console.log(
      //   `WriteOnlyStore[${this.robotId}] data channel closed:`,
      //   channel.label,
      //   "state:",
      //   channel.readyState,
      // )
      this.notifyConnectionStateChange(false, channel.readyState)
    }

    channel.onerror = (error) => {
      console.error(
        `WriteOnlyStore[${this.robotId}] data channel error:`,
        channel.label,
        error,
      )
      this.notifyConnectionStateChange(false, channel.readyState)
    }

    // Notify immediately if initial state is already open
    if (channel.readyState === "open") {
      this.notifyConnectionStateChange(true, channel.readyState)
    }
  }

  // Notify connection state change
  private notifyConnectionStateChange(connected: boolean, state: string): void {
    this.connectionStateListeners.forEach((listener) => {
      try {
        listener(connected, state)
      } catch (error) {
        console.error("Connection state listener error:", error)
      }
    })
  }

  // Register connection state change listener
  public onConnectionStateChange(
    listener: (connected: boolean, state: string) => void,
  ): () => void {
    this.connectionStateListeners.push(listener)

    // Notify current state immediately
    if (this.dataChannel) {
      listener(this.isChannelConnected(), this.dataChannel.readyState)
    }

    // Return listener removal function
    return () => {
      this.connectionStateListeners = this.connectionStateListeners.filter(
        (l) => l !== listener,
      )
    }
  }

  // Get data channel
  public getDataChannel(): RTCDataChannel | null {
    return this.dataChannel
  }

  // Check data channel connection status
  public isChannelConnected(): boolean {
    return this.dataChannel?.readyState === "open"
  }

  // Clean up data channel
  public cleanupDataChannel(): void {
    if (this.dataChannel) {
      // Remove event listeners
      this.dataChannel.onopen = null
      this.dataChannel.onclose = null
      this.dataChannel.onerror = null

      this.dataChannel = null
      this.connectionStateListeners = []
      // console.log(`WriteOnlyStore[${this.robotId}] data channel cleaned up`)
    }
  }

  // Get data channel state information
  public getChannelInfo(): {
    connected: boolean
    label?: string
    state?: string
  } {
    return {
      connected: this.isChannelConnected(),
      label: this.dataChannel?.label,
      state: this.dataChannel?.readyState,
    }
  }

  // Get detailed channel state information
  public getChannelState(): {
    connected: boolean
    state: string
    label?: string
    bufferedAmount: number
    protocol?: string
  } {
    return {
      connected: this.isChannelConnected(),
      state: this.dataChannel?.readyState || "closed",
      label: this.dataChannel?.label,
      bufferedAmount: this.dataChannel?.bufferedAmount || 0,
      protocol: this.dataChannel?.protocol,
    }
  }

  // Check if write-only store always needs a channel
  public isChannelRequired(): boolean {
    return this.channelRequired
  }

  // Abstract method: send data
  protected abstract sendData(data: any): void

  // Send data (check connection status first)
  protected sendDataIfConnected(data: any): boolean {
    if (this.isChannelConnected()) {
      this.sendData(data)
      return true
    }
    console.warn(
      `WriteOnlyStore[${this.robotId}] data channel is not connected. send failed. state:`,
      this.dataChannel?.readyState,
    )
    return false
  }

  // Force data send (ignore connection status)
  protected sendDataForce(data: any): void {
    if (this.dataChannel) {
      try {
        this.dataChannel.send(data)
        // console.log(`WriteOnlyStore[${this.robotId}] force data send: ${data}`)
      } catch (error) {
        console.error(
          `WriteOnlyStore[${this.robotId}] data send failed:`,
          error,
        )
      }
    } else {
      console.error(
        `WriteOnlyStore[${this.robotId}] data channel is not found. send failed`,
      )
    }
  }
}
