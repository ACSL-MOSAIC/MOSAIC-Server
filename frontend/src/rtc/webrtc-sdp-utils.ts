export function parseMetadataFromSdp(sdp: string): Map<string, any> {
  const metadata = new Map<string, any>();
  
  // Normalize Windows line endings to Unix line endings
  const normalizedSdp = sdp.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedSdp.split('\n');
  
  console.log('🔍 SDP parsing started:', normalizedSdp.substring(0, 200) + '...');
  
  // Check MSID semantic for base schema
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
  
  // Parse MSID for each media section
  const mediaTracks: Array<{trackName: string, trackId: string}> = [];
  for (const line of lines) {
    const msidMatch = line.match(/^a=msid:\s*([^\s]+)\s+([^\s]+)$/);
    if (msidMatch) {
      const trackName = msidMatch[1].trim();
      const trackId = msidMatch[2].trim();
      mediaTracks.push({ trackName, trackId });
      console.log('MSID Track Parsed:', trackName, trackId);
    } else {
      // Output msid lines for debugging
      if (line.includes('a=msid:')) {
        console.log('MSID Line Found (No Match):', line);
      }
    }
  }
  
  if (mediaTracks.length > 0) {
    // Use first track as primary media type
    const primaryTrack = mediaTracks[0];
    metadata.set('mediaType', primaryTrack.trackName);
    metadata.set('trackName', primaryTrack.trackName);
    metadata.set('trackId', primaryTrack.trackId);
    metadata.set('allTracks', mediaTracks);
    console.log('✅ Final media type set:', primaryTrack.trackName);
  } else {
    console.warn('⚠️ No media tracks parsed');
    // Output all lines for debugging
    console.log('🔍 All lines:', lines.filter(line => line.includes('msid')));
  }
  
  return metadata;
}

// SDP Offer creation (based on configured media channels)
export async function createOfferWithMediaChannels(
  peerConnection: RTCPeerConnection,
  activeMediaChannels: string[]
): Promise<RTCSessionDescriptionInit> {
  
  // Add video transceivers based on configured media channels
  activeMediaChannels.forEach((mediaType, index) => {
    peerConnection.addTransceiver('video', {
      direction: 'recvonly'
    });
  });
  
  // Create offer
  const offer = await peerConnection.createOffer();
  
  return offer;
}
