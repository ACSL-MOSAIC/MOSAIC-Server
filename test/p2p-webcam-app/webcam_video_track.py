import cv2
import time
import asyncio
import fractions

from av import VideoFrame
from aiortc import MediaStreamTrack


# 웹캠 비디오 트랙 클래스 정의
class WebcamVideoTrack(MediaStreamTrack):
    # MediaStreamTrac k의 kind 속성 설정
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
        """
        rtc 전송을 위한 MediaStreamTrack 클래스의 abstract method 구현체
        지정한 framerate 에 맞춰 프레임을 읽어와서 rtc 로 전송하는 메소드
        """
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


__all__ = ["WebcamVideoTrack"]
