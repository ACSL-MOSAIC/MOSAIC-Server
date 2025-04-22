import asyncio
import cv2
import fractions
import time
import socketio
import argparse
from av import VideoFrame
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, RTCConfiguration, \
    RTCIceServer


# 웹캠 비디오 트랙 클래스 정의
class WebcamVideoTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self, framerate=30):
        super().__init__()
        self.cap = cv2.VideoCapture(0)  # 기본 웹캠 사용
        self.framerate = framerate
        self.frame_interval = 1 / framerate
        self.last_frame_time = time.time()

        # 웹캠 해상도 설정 (옵션)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    async def recv(self):
        # 프레임 간격 유지를 위한 시간 조절
        now = time.time()
        if now - self.last_frame_time < self.frame_interval:
            await asyncio.sleep(self.frame_interval - (now - self.last_frame_time))

        ret, frame = self.cap.read()
        if not ret:
            raise RuntimeError("웹캠에서 프레임을 읽을 수 없습니다")

        # OpenCV BGR을 RGB로 변환
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # VideoFrame 객체 생성
        video_frame = VideoFrame.from_ndarray(frame, format="rgb24")
        video_frame.pts = int(time.time() * 1000)  # 타임스탬프 설정
        video_frame.time_base = fractions.Fraction(1, 1000)  # 타임베이스 설정

        self.last_frame_time = time.time()
        return video_frame

selected_user = None
my_sid = None

def get_peer_connection(turn_server, turn_username, turn_credential):
    # RTCPeerConnection 설정
    ice_servers = [
        RTCIceServer(
            urls=f'turn:{turn_server}',
            username=turn_username,
            credential=turn_credential,
            credentialType='password'
        )
    ]
    rtc_conf = RTCConfiguration(iceServers=ice_servers)
    pc = RTCPeerConnection(rtc_conf)
    return pc

async def run_webrtc_client(server_url, turn_server, turn_username, turn_credential):
    # Socket.IO 클라이언트 설정
    sio = socketio.AsyncClient()

    pc = get_peer_connection(turn_server, turn_username, turn_credential)

    # 웹캠 트랙 생성
    webcam = WebcamVideoTrack(framerate=60)

    # 로컬 트랙 추가
    pc.addTrack(webcam)

    # 선택된 사용자 ID
    @sio.on('connect')
    async def connect():
        print(f"Socket.IO 서버에 연결 되었습니다")
        await sio.emit('retrieveSID')

    @sio.on('disconnect')
    async def disconnect():
        print("Socket.IO 서버와의 연결이 끊겼습니다")

    @sio.on('retrieveSID')
    async def retrieve_sid(data):
        global my_sid
        my_sid = data["sid"]
        await sio.emit("requestUserList")

    @sio.on("update-user-list")
    async def update_user_list(data):
        global my_sid
        global selected_user

        user_ids = data["userIds"]
        # 자신의 ID를 제외한 다른 사용자 목록
        other_users = [uid for uid in user_ids if uid != my_sid]

        if other_users:
            # 첫 번째 사용자를 자동으로 선택
            selected_user = other_users[0]

            # 오퍼 생성 및 전송
            await create_and_send_offer()


    @sio.on('mediaAnswer')
    async def media_answer(data):
        answer = RTCSessionDescription(
            sdp=data["answer"]["sdp"],
            type=data["answer"]["type"]
        )
        await pc.setRemoteDescription(answer)


    @sio.on('remotePeerIceCandidate')
    async def remote_peer_ice_candidate(data):
        global my_sid
        if data.get("to") == my_sid and data.get("candidate"):
            candidate = RTCIceCandidate(
                sdpMid=data["candidate"]["sdpMid"],
                sdpMLineIndex=data["candidate"]["sdpMLineIndex"],
            )
            await pc.addIceCandidate(candidate)

    # ICE 후보 이벤트 처리
    @pc.on("icecandidate")
    async def on_ice_candidate(candidate):
        global selected_user

        if candidate and selected_user:
            await sio.emit("iceCandidate", {
                "to": selected_user,
                "candidate": {
                    "sdpMid": candidate.sdpMid,
                    "sdpMLineIndex": candidate.sdpMLineIndex,
                    "candidate": candidate.candidate
                }
            })

    async def create_and_send_offer():
        global selected_user
        global my_sid

        # 오퍼 생성
        offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        # 오퍼 전송
        if selected_user:
            await sio.emit("mediaOffer", {
                "offer": {
                    "type": pc.localDescription.type,
                    "sdp": pc.localDescription.sdp
                },
                "from": my_sid,
                "to": selected_user
            })

    # 서버에 연결
    await sio.connect(server_url, socketio_path="/ws/socket.io")

    try:
        # 연결이 유지되는 동안 실행
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("종료 중...")
    finally:
        # 연결 정리
        webcam.cap.release()
        await pc.close()
        await sio.disconnect()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebRTC 웹캠 송신기")
    parser.add_argument("--server", type=str, default="http://localhost:3001", help="시그널링 서버 URL")
    parser.add_argument("--turn", type=str, default="acslgcs.com:3478", help="TURN 서버")
    parser.add_argument("--username", type=str, default="gistacsl", help="TURN 서버 사용자 이름")
    parser.add_argument("--credential", type=str, default="qwqw!123", help="TURN 서버 비밀번호")

    args = parser.parse_args()

    asyncio.run(run_webrtc_client(
        server_url=args.server,
        turn_server=args.turn,
        turn_username=args.username,
        turn_credential=args.credential
    ))