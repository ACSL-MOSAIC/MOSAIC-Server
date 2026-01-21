// SDP Offer creation (based on configured media channels)
export async function createOfferWithMediaChannels(
  peerConnection: RTCPeerConnection,
  activeMediaChannels: string[],
): Promise<RTCSessionDescriptionInit> {
  // Add video transceivers based on configured media channels
  let index = 0
  for (index = 0; index < activeMediaChannels.length; index++) {
    peerConnection.addTransceiver("video", {
      direction: "recvonly",
    })
  }

  // Create offer
  const offer = await peerConnection.createOffer()

  return offer
}
