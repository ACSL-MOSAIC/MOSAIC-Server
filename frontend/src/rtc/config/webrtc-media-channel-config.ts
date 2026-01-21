// Media type store factory mapping (same pattern as data channels)
export const MEDIA_CHANNEL_CONFIG = {
  video_stream: {
    type: "video_stream",
    channelType: "readonly" as const,
    defaultLabel: "video_stream",
  },
  video_stream_v2: {
    type: "video_stream_v2",
    channelType: "readonly" as const,
    defaultLabel: "video_stream_v2",
  },
} as const

// Media type symbol mapping (dynamically generated)
export const MEDIA_TYPE_SYMBOLS = {
  video_stream: Symbol("video_stream"),
  video_stream_v2: Symbol("video_stream_v2"),
} as const

// Utility functions (same pattern as data channels)
export const MediaChannelConfigUtils = {
  /**
   * Check if media type is supported
   */
  isSupportedMediaType(
    mediaType: string,
  ): mediaType is keyof typeof MEDIA_CHANNEL_CONFIG {
    return mediaType in MEDIA_CHANNEL_CONFIG
  },

  /**
   * Get channel direction for media type (currently all readonly)
   */
  getChannelDirection(mediaType: string): "readonly" | "writeonly" | null {
    const config =
      MEDIA_CHANNEL_CONFIG[mediaType as keyof typeof MEDIA_CHANNEL_CONFIG]
    return config?.channelType || null
  },

  /**
   * Get default label for media type
   */
  getDefaultMediaLabel(mediaType: string): string | null {
    const config =
      MEDIA_CHANNEL_CONFIG[mediaType as keyof typeof MEDIA_CHANNEL_CONFIG]
    return config?.defaultLabel || null
  },

  /**
   * Get symbol for media type
   */
  getMediaTypeSymbol(mediaType: string): symbol | null {
    return (
      MEDIA_TYPE_SYMBOLS[mediaType as keyof typeof MEDIA_TYPE_SYMBOLS] || null
    )
  },

  /**
   * Get list of supported media types
   */
  getSupportedMediaTypes(): readonly string[] {
    return Object.keys(MEDIA_CHANNEL_CONFIG)
  },

  /**
   * Get list of active media channels (all configured media types)
   */
  getActiveMediaChannels(): string[] {
    return [...this.getSupportedMediaTypes()]
  },

  /**
   * Get number of video tracks to request (number of configured media types)
   */
  getRequestedVideoTrackCount(): number {
    return this.getSupportedMediaTypes().length
  },

  /**
   * Generate channel label from media type
   */
  generateChannelLabel(mediaType: string, robotId: string): string {
    const config =
      MEDIA_CHANNEL_CONFIG[mediaType as keyof typeof MEDIA_CHANNEL_CONFIG]
    if (config) {
      return `${config.defaultLabel}_${robotId}`
    }
    return `video_track_${robotId}`
  },
}

// Type definitions
export type MediaType = keyof typeof MEDIA_CHANNEL_CONFIG
export type MediaChannelType = "readonly"
