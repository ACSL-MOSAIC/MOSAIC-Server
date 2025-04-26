import asyncio
import argparse

from webcam_video_track import WebcamVideoTrack
from webrtc_client import WebRTCClient


def create_webcam_track(framerate=60):
    """Create a webcam video track."""
    webcam = WebcamVideoTrack(framerate=framerate)
    return webcam


def close_webcam_track(webcam):
    """Close the webcam track."""
    webcam.cap.release()


async def run_webrtc_client(signal_server_url, turn_server, turn_username, turn_credential):

    web_rtc_client = WebRTCClient(turn_server, turn_username, turn_credential, create_webcam_track, close_webcam_track)

    await web_rtc_client.run(signal_server_url)

    try:
        # 연결이 유지되는 동안 실행
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("종료 중...")
    finally:
        # 연결 정리
        webcam.cap.release()
        await web_rtc_client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebRTC 웹캠 송신기")
    parser.add_argument("--signal_server", type=str, default="https://acslgcs.com:3001", help="시그널링 서버 URL")
    parser.add_argument("--turn", type=str, default="turn.acslgcs.com:3478", help="TURN 서버")
    parser.add_argument("--username", type=str, default="gistacsl", help="TURN 서버 사용자 이름")
    parser.add_argument("--credential", type=str, default="qwqw!12321", help="TURN 서버 비밀번호")

    args = parser.parse_args()

    asyncio.run(run_webrtc_client(
        signal_server_url=args.signal_server,
        turn_server=args.turn,
        turn_username=args.username,
        turn_credential=args.credential
    ))
