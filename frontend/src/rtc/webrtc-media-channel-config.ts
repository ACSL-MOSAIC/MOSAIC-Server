// 미디어 채널 기본 설정 (트랙 개수만 관리)
export const MEDIA_CHANNEL_CONFIG = {
  // 기본 비디오 트랙 개수 설정
  defaultVideoTracks: 1, // 기본적으로 1개의 비디오 트랙 요청
  
  // 지원 가능한 미디어 타입들 (로봇에서 메타데이터로 전달받을 예정)
  supportedMediaTypes: [
    'turtlesim_video',
  ] as const
} as const;

// 기본 미디어 채널 설정 (트랙 개수 기반)
export const DEFAULT_MEDIA_CHANNELS = [
  {
    label: 'video_track_0',
    dataType: 'video', // 일반적인 비디오 타입
    channelType: 'readonly' as const,
    msid: {
      streamId: 'video_stream_0',
      trackId: 'video_track_0'
    }
  }
] as const;

// 미디어 타입별 심볼 매핑 (동적으로 생성될 예정)
export const MEDIA_TYPE_SYMBOLS = {
  'turtlesim_video': Symbol('turtlesim_video'),
} as const;

// 유틸리티 함수들
export const MediaChannelConfigUtils = {
  /**
   * 요청할 비디오 트랙 개수 반환
   */
  getRequestedVideoTrackCount(): number {
    return MEDIA_CHANNEL_CONFIG.defaultVideoTracks;
  },

  /**
   * 지원되는 미디어 타입 목록 반환
   */
  getSupportedMediaTypes(): readonly string[] {
    return MEDIA_CHANNEL_CONFIG.supportedMediaTypes;
  },

  /**
   * 미디어 타입이 지원되는지 확인
   */
  isSupportedMediaType(mediaType: string): mediaType is keyof typeof MEDIA_TYPE_SYMBOLS {
    return mediaType in MEDIA_TYPE_SYMBOLS;
  },

  /**
   * 미디어 타입의 심볼 반환
   */
  getMediaTypeSymbol(mediaType: string): symbol | null {
    return MEDIA_TYPE_SYMBOLS[mediaType as keyof typeof MEDIA_TYPE_SYMBOLS] || null;
  },

  /**
   * 활성화된 미디어 채널 목록 반환 (트랙 개수 기반)
   */
  getActiveMediaChannels(): string[] {
    const count = this.getRequestedVideoTrackCount();
    return Array.from({ length: count }, (_, i) => `video_track_${i}`);
  },

  /**
   * 기본 MSID 정보 생성
   */
  getDefaultMsidInfo(trackIndex: number): { streamId: string; trackId: string } {
    return {
      streamId: `video_stream_${trackIndex}`,
      trackId: `video_track_${trackIndex}`
    };
  }
};

// 타입 정의
export type MediaType = keyof typeof MEDIA_TYPE_SYMBOLS;
export type MediaChannelType = 'readonly';
export type MediaChannelConfigItem = typeof DEFAULT_MEDIA_CHANNELS[number]; 