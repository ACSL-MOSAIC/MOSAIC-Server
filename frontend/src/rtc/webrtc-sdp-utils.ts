export function parseMetadataFromSdp(sdp: string): Map<string, any> {
  const metadata = new Map<string, any>();
  const lines = sdp.split('\n');
  
  for (const line of lines) {
    // MSID semantic 파싱 - 미디어 타입 추출
    const msidSemanticMatch = line.match(/^a=msid-semantic:\s+WMS\s+(.+)_track$/);
    if (msidSemanticMatch) {
      const mediaType = msidSemanticMatch[1].trim();
      metadata.set('mediaType', mediaType);
      console.log('📡 MSID에서 미디어 타입 추출:', mediaType);
      continue;
    }
    
    // 기존 커스텀 속성들은 제거 (MSID 기반으로 대체)
    // a=media-type:, a=track-description:, a=track-quality:, a=track-source:, a=track-index: 삭제
  }
  
  return metadata;
}

// SDP Offer creation (based on configured media channels)
export async function createOfferWithMediaChannels(
  peerConnection: RTCPeerConnection,
  activeMediaChannels: string[]
): Promise<RTCSessionDescriptionInit> {
  
  console.log('sdp offer create started', activeMediaChannels);
  
  // add video transceivers based on configured media channels
  activeMediaChannels.forEach((mediaType, index) => {
    console.log(`add video transceiver: ${mediaType} (index: ${index})`);
    peerConnection.addTransceiver('video', {
      direction: 'recvonly'
    });
  });
  
  // create offer
  const offer = await peerConnection.createOffer();

  console.log('SDP Offer creation completed');
  
  return offer;
}
