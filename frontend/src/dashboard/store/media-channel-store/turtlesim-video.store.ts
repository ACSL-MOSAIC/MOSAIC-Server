import { VideoStore } from "./video-store"

export class TurtlesimVideoStore extends VideoStore {
  // Cleanup method
  public destroy(): void {
    super.destroy()
  }
}
