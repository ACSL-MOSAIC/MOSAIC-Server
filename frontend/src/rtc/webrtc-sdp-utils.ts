export function parseMetadataFromSdp(sdp: string): Map<string, any> {
  const metadata = new Map<string, any>();
  
  // Windows 줄바꿈 문자를 Unix 줄바꿈으로 정규화
  const normalizedSdp = sdp.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedSdp.split('\n');
  
  console.log('🔍 SDP 파싱 시작:', normalizedSdp.substring(0, 200) + '...');
  
  // MSID semantic에서 기본 스키마 확인
  let msidSchema = '';
  for (const line of lines) {
    const msidSemanticMatch = line.match(/^a=msid-semantic:\s+WMS\s+(.+)$/);
    if (msidSemanticMatch) {
      msidSchema = msidSemanticMatch[1].trim();
      metadata.set('msidSchema', msidSchema);
      console.log('MSID Schema Parsed:', msidSchema);
      break;
    }
  }
  
  // 각 미디어 섹션의 MSID 파싱
  const mediaTracks: Array<{trackName: string, trackId: string}> = [];
  for (const line of lines) {
    const msidMatch = line.match(/^a=msid:\s*([^\s]+)\s+([^\s]+)$/);
    if (msidMatch) {
      const trackName = msidMatch[1].trim();
      const trackId = msidMatch[2].trim();
      mediaTracks.push({ trackName, trackId });
      console.log('MSID Track Parsed:', trackName, trackId);
    } else {
      // 디버깅을 위해 msid 라인 출력
      if (line.includes('a=msid:')) {
        console.log('MSID Line Found (No Match):', line);
      }
    }
  }
  
  if (mediaTracks.length > 0) {
    // 첫 번째 트랙을 기본 미디어 타입으로 사용
    const primaryTrack = mediaTracks[0];
    metadata.set('mediaType', primaryTrack.trackName);
    metadata.set('trackName', primaryTrack.trackName);
    metadata.set('trackId', primaryTrack.trackId);
    metadata.set('allTracks', mediaTracks);
    console.log('✅ 최종 미디어 타입 설정:', primaryTrack.trackName);
  } else {
    console.warn('⚠️ 파싱된 미디어 트랙이 없습니다');
    // 디버깅을 위해 모든 라인 출력
    console.log('🔍 모든 라인:', lines.filter(line => line.includes('msid')));
  }
  
  return metadata;
}

// SDP Offer creation (based on configured media channels)
export async function createOfferWithMediaChannels(
  peerConnection: RTCPeerConnection,
  activeMediaChannels: string[]
): Promise<RTCSessionDescriptionInit> {
  
  // add video transceivers based on configured media channels
  activeMediaChannels.forEach((mediaType, index) => {
    peerConnection.addTransceiver('video', {
      direction: 'recvonly'
    });
  });
  
  // create offer
  const offer = await peerConnection.createOffer();
  
  return offer;
}
