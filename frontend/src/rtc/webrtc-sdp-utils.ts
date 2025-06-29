export function parseMetadataFromSdp(sdp: string): Map<string, any> {
  const metadata = new Map<string, any>();
  const lines = sdp.split('\n');
  
  for (const line of lines) {
    // regex based parsing
    const mediaTypeMatch = line.match(/^a=media-type:(.+)$/);
    if (mediaTypeMatch) {
      metadata.set('mediaType', mediaTypeMatch[1].trim());
      continue;
    }
    
    const descriptionMatch = line.match(/^a=track-description:(.+)$/);
    if (descriptionMatch) {
      metadata.set('description', descriptionMatch[1].trim());
      continue;
    }
    
    const qualityMatch = line.match(/^a=track-quality:(.+)$/);
    if (qualityMatch) {
      metadata.set('quality', qualityMatch[1].trim());
      continue;
    }
    
    const sourceMatch = line.match(/^a=track-source:(.+)$/);
    if (sourceMatch) {
      metadata.set('source', sourceMatch[1].trim());
      continue;
    }
    
    const indexMatch = line.match(/^a=track-index:(\d+)$/);
    if (indexMatch) {
      metadata.set('trackIndex', parseInt(indexMatch[1]));
      continue;
    }
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
