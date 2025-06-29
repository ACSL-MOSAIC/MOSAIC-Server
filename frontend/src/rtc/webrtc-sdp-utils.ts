import { MediaChannelConfigUtils } from './webrtc-media-channel-config';
import { VideoStoreManager } from '../dashboard/store/media-channel-store/video-store-manager';

export function parseMetadataFromSdp(sdp: string): Map<string, any> {
  const metadata = new Map<string, any>();
  const lines = sdp.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('a=media-type:')) {
      const mediaType = line.substring(13);
      metadata.set('mediaType', mediaType);
    } else if (line.startsWith('a=track-description:')) {
      const description = line.substring(20);
      metadata.set('description', description);
    } else if (line.startsWith('a=track-quality:')) {
      const quality = line.substring(16);
      metadata.set('quality', quality);
    } else if (line.startsWith('a=track-source:')) {
      const source = line.substring(15);
      metadata.set('source', source);
    } else if (line.startsWith('a=track-index:')) {
      const index = parseInt(line.substring(14));
      metadata.set('trackIndex', index);
    }
  }
  
  return metadata;
}

// SDP Offer 생성 시 미디어 채널 설정 적용 (단순화)
export async function createOfferWithMediaChannels(
  peerConnection: RTCPeerConnection,
  activeMediaChannels: string[]
): Promise<RTCSessionDescriptionInit> {
  
  console.log('📤 SDP Offer 생성 시작, 요청 트랙:', activeMediaChannels);
  
  // 기본 Offer 생성 (비디오 수신 요청)
  const offer = await peerConnection.createOffer({
    offerToReceiveVideo: true,
    offerToReceiveAudio: false
  });

  // 활성화된 미디어 채널에 따라 SDP 수정
  if (!offer.sdp) {
    throw new Error('SDP Offer 생성 실패: sdp가 undefined입니다.');
  }
  
  const modifiedSdp = addDefaultMsidToSdp(offer.sdp, activeMediaChannels);
  
  console.log('📤 SDP Offer 생성 완료');
  
  return {
    type: 'offer',
    sdp: modifiedSdp
  };
}

// SDP에 기본 MSID 정보 추가
export function addDefaultMsidToSdp(sdp: string, activeMediaChannels: string[]): string {
  const lines = sdp.split('\n');
  const modifiedLines: string[] = [];
  
  let mediaSectionIndex = 0;
  
  for (const line of lines) {
    modifiedLines.push(line);
    
    // 미디어 섹션 시작 감지
    if (line.startsWith('m=video')) {
      const trackIndex = mediaSectionIndex;
      const msidInfo = {
        streamId: `video_stream_${trackIndex}`,
        trackId: `video_track_${trackIndex}`
      };
      
      const msidLine = `a=msid:${msidInfo.streamId} ${msidInfo.trackId}`;
      modifiedLines.push(msidLine);
      console.log(`📤 SDP에 기본 MSID 추가: ${msidLine}`);
      
      mediaSectionIndex++;
    }
  }
  
  return modifiedLines.join('\n');
}

// SDP Answer 수신 시 msid 정보 추출 및 반환
export function handleSdpAnswer(
  answer: RTCSessionDescriptionInit
): Map<string, string> {
  
  console.log('📥 SDP Answer 처리 시작');
  console.log('📋 SDP Answer 타입:', answer.type);
  
  // SDP에서 msid 정보 추출
  if (!answer.sdp) {
    console.error('❌ SDP Answer가 undefined입니다.');
    return new Map();
  }
  
  console.log('📋 SDP Answer 내용 (처음 500자):', answer.sdp.substring(0, 500));
  
  const msidMap = parseMsidFromSdp(answer.sdp);
  console.log('🔍 SDP에서 추출된 msid 정보:', {
    msidCount: msidMap.size,
    msidEntries: Array.from(msidMap.entries())
  });
  
  return msidMap;
}

// SDP에서 msid 정보 파싱 (여러 스트림/트랙 지원)
export function parseMsidFromSdp(sdp: string): Map<string, string> {
  const msidMap = new Map<string, string>();
  const lines = sdp.split('\n');
  
  console.log('🔍 SDP 라인 수:', lines.length);
  
  // 모든 msid 라인을 찾아서 매핑
  for (const line of lines) {
    if (line.startsWith('a=msid:')) {
      const parts = line.substring(7).split(' ');
      const streamId = parts[0];
      const trackId = parts[1] || streamId;
      msidMap.set(trackId, streamId);
      console.log(`✅ SDP에서 msid 파싱: trackId=${trackId}, streamId=${streamId}`);
    }
  }
  
  if (msidMap.size === 0) {
    console.warn('⚠️ SDP에서 msid 정보를 찾을 수 없음');
    console.log('🔍 SDP에서 msid 관련 라인 검색:');
    const msidLines = lines.filter(line => line.includes('msid'));
    console.log('msid 관련 라인들:', msidLines);
  } else {
    console.log(`✅ 총 ${msidMap.size}개의 MSID 정보 발견`);
  }
  
  return msidMap;
}

// Video Store 연결을 위한 ontrack 이벤트 핸들러 설정 (메타데이터 기반)
export function setupVideoTrackHandler(
  peerConnection: RTCPeerConnection,
  videoStoreManager: VideoStoreManager,
  robotId: string,
  msidMap: Map<string, string>,
  sdpAnswer: string
): void {
  
  console.log('🔧 Video Track Handler 설정 시작:', {
    robotId,
    msidMapSize: msidMap.size,
    msidMapEntries: Array.from(msidMap.entries())
  });
  
  // SDP Answer에서 메타데이터 파싱
  const metadata = parseMetadataFromSdp(sdpAnswer);
  console.log('🔍 SDP 메타데이터:', Object.fromEntries(metadata));
  
  peerConnection.ontrack = (event) => {
    console.log('🎬 ontrack 이벤트 발생:', {
      trackKind: event.track.kind,
      trackId: event.track.id,
      trackLabel: event.track.label,
      trackReadyState: event.track.readyState,
      streamsCount: event.streams?.length || 0,
      hasStreams: !!event.streams,
      firstStreamId: event.streams?.[0]?.id
    });
    
    if (event.track.kind === 'video') {
      console.log('✅ 비디오 트랙 감지됨');
      
      if (event.streams && event.streams[0]) {
        console.log('✅ 스트림이 존재함');
        const stream = event.streams[0];
        const trackId = event.track.id;
        const streamId = msidMap.get(trackId);
        
        console.log('🔍 비디오 트랙 상세 정보:', {
          trackId,
          streamId,
          actualStreamId: stream.id,
          trackLabel: event.track.label,
          streamTracksCount: stream.getTracks().length,
          streamActive: stream.active
        });
        
        // 메타데이터에서 미디어 타입 결정
        const mediaType = metadata.get('mediaType') || 'turtlesim_video';
        const description = metadata.get('description') || 'Unknown Video Stream';
        const quality = metadata.get('quality') || '640x480@30fps';
        const source = metadata.get('source') || 'unknown';
        const trackIndex = metadata.get('trackIndex') || 0;
        
        console.log('🔍 메타데이터 기반 미디어 정보:', {
          mediaType,
          description,
          quality,
          source,
          trackIndex
        });
        
        // 미디어 타입이 지원되는지 확인
        if (MediaChannelConfigUtils.isSupportedMediaType(mediaType)) {
          console.log(`✅ 지원되는 미디어 타입: ${mediaType}`);
          
          // 설정에서 정보 가져오기
          const storeType = MediaChannelConfigUtils.getMediaTypeSymbol(mediaType);
          
          console.log('🔍 설정 정보:', {
            storeType: storeType ? 'found' : 'not found',
            mediaType
          });
          
          if (storeType) {
            console.log('✅ 스토어 타입 심볼 찾음');
            
            // 미디어 타입으로 VideoStore 생성
            const videoStore = videoStoreManager.createVideoStoreByMediaTypeAuto(
              robotId, 
              mediaType
            );
            
            console.log('🔍 VideoStore 생성 결과:', {
              videoStore: videoStore ? 'created' : 'failed',
              robotId,
              mediaType
            });
            
            if (videoStore) {
              // 메타데이터 설정
              videoStore.setMetadata({
                mediaType,
                description,
                quality,
                source,
                trackIndex
              });
              
              videoStore.setMediaStream(stream);
              console.log(`✅ Video Store 연결 완료: ${mediaType} for robot ${robotId}`);
            } else {
              console.warn(`❌ Video Store를 찾을 수 없음: ${mediaType} for robot ${robotId}`);
            }
          } else {
            console.warn(`❌ 미디어 타입 ${mediaType}에 대한 심볼을 찾을 수 없음`);
          }
        } else {
          console.warn(`❌ 지원되지 않는 미디어 타입: ${mediaType}`);
          console.log('🔍 지원되는 미디어 타입들:', MediaChannelConfigUtils.getSupportedMediaTypes());
        }
      } else {
        console.warn('❌ 비디오 트랙에 스트림이 없음');
      }
    } else {
      console.log('ℹ️ 비디오가 아닌 트랙 무시:', event.track.kind);
    }
  };
  
  console.log('🔧 Video Track Handler 설정 완료');
} 