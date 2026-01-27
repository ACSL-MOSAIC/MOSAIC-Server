import {MosaicStore} from "./mosaic-store.ts"

export abstract class MediaStreamStore extends MosaicStore {
  protected stream: MediaStream | null = null

  public getStoreType(): "media" {
    return "media"
  }

  public abstract setMediaStream(stream: MediaStream): void
}
