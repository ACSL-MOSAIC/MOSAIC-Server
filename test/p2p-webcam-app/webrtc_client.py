import asyncio

import socketio
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, RTCConfiguration, RTCIceServer


def parse_candidate(candidate_str):
    # candidate:2789056832 1 udp 2122063615 14.37.3.236 49280 typ host generation 3 ufrag vwQg network-id 4
    parts = candidate_str.split()
    foundation = parts[0].split(':')[1]
    component = int(parts[1])
    protocol = parts[2]
    priority = int(parts[3])
    ip = parts[4]
    port = int(parts[5])

    # 'typ' 이후의 값 가져오기
    typ_index = parts.index('typ')
    candidate_type = parts[typ_index + 1]

    # related-address와 related-port가 있는지 확인
    related_address = None
    related_port = None

    if 'raddr' in parts:
        raddr_index = parts.index('raddr')
        related_address = parts[raddr_index + 1]

    if 'rport' in parts:
        rport_index = parts.index('rport')
        related_port = int(parts[rport_index + 1])

    # TCP 타입이 있는지 확인
    tcp_type = None
    if protocol == 'tcp' and 'tcptype' in parts:
        tcptype_index = parts.index('tcptype')
        tcp_type = parts[tcptype_index + 1]

    return {
        'foundation': foundation,
        'component': component,
        'protocol': protocol,
        'priority': priority,
        'ip': ip,
        'port': port,
        'type': candidate_type,
        'relatedAddress': related_address,
        'relatedPort': related_port,
        'tcpType': tcp_type
    }


def get_peer_connection(turn_server, turn_username, turn_credential):
    """
    RTCPeerConnection 객체 반환 메소드
    :param turn_server: turn 서버 주소
    :param turn_username: turn 서버에 사용되는 아이디 (username)
    :param turn_credential: turn 서버에 사용되는 비밀번호 (credential)
    :return: 구성된 RTCPeerConnection 객체
    """
    print(f"TURN 서버: {turn_server}, 사용자 이름: {turn_username}, 비밀번호: {turn_credential}")
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


class WebRTCClient(object):
    sio = None
    pc = None
    selected_user = None
    my_sid = None

    ice_server_config = {
        "turn_server": None,
        "turn_username": None,
        "turn_credential": None,
    }
    is_connecting = False
    RETRY_DELAY = 1 # 재연결 대기 시간 (초)

    cached_track = None
    current_sender = None
    is_track_active = False

    def __init__(self, turn_server, turn_username, turn_credential):
        self.sio = socketio.AsyncClient()
        self.ice_server_config["turn_server"] = turn_server
        self.ice_server_config["turn_username"] = turn_username
        self.ice_server_config["turn_credential"] = turn_credential
        self.pc = get_peer_connection(turn_server, turn_username, turn_credential)

        self.__register_sio_events()
        self.__register_peer_connection_events()

    def __register_sio_events(self):
        # 선택된 사용자 ID
        @self.sio.on('connect')
        async def connect():
            print(f"Socket.IO 서버에 연결 되었습니다")
            await self.sio.emit('retrieveSID')

        @self.sio.on('disconnect')
        async def disconnect():
            print("Socket.IO 서버와의 연결이 끊겼습니다")

        @self.sio.on('retrieveSID')
        async def retrieve_sid(data):
            print("SID retrieved from server")
            self.my_sid = data["sid"]
            print(f"내 SID: {self.my_sid}")
            print("사용자 목록 요청 (update-user-list)")
            await self.sio.emit("requestUserList")

        @self.sio.on("update-user-list")
        async def update_user_list(data):

            user_ids = data["userIds"]
            # 자신의 ID를 제외한 다른 사용자 목록
            other_users = [uid for uid in user_ids if uid != self.my_sid]

            if other_users:
                # 첫 번째 사용자를 자동으로 선택
                self.selected_user = other_users[0]

                print(f"선택된 사용자: {self.selected_user}")

                # 오퍼 생성 및 전송
                await self.__create_and_send_offer()

        @self.sio.on('mediaAnswer')
        async def media_answer(data):
            try:
                print(f"미디어 응답 수신: {data}")
                answer = RTCSessionDescription(
                    sdp=data["answer"]["sdp"],
                    type=data["answer"]["type"]
                )
                await self.pc.setRemoteDescription(answer)
            except Exception as e:
                print(f"미디어 응답 처리 중 오류 발생: {e}")
                await self._reset_connection()

        @self.sio.on('remotePeerIceCandidate')
        async def remote_peer_ice_candidate(data):
            if data.get("candidate"):
                candidate_info = parse_candidate(data["candidate"]["candidate"])

                candidate = RTCIceCandidate(
                    component=candidate_info['component'],
                    foundation=candidate_info['foundation'],
                    ip=candidate_info['ip'],
                    port=candidate_info['port'],
                    priority=candidate_info['priority'],
                    protocol=candidate_info['protocol'],
                    type=candidate_info['type'],
                    relatedAddress=candidate_info['relatedAddress'],
                    relatedPort=candidate_info['relatedPort'],
                    sdpMid=data["candidate"]["sdpMid"],
                    sdpMLineIndex=data["candidate"]["sdpMLineIndex"],
                    tcpType=candidate_info['tcpType']
                )

                await self.pc.addIceCandidate(candidate)

    def __register_peer_connection_events(self):
        # ICE 후보 이벤트 처리
        @self.pc.on("icecandidate")
        async def on_ice_candidate(candidate):
            print(f"ICE 후보: {candidate}")
            if candidate and self.selected_user:
                await self.sio.emit("iceCandidate", {
                    "to": self.selected_user,
                    "candidate": {
                        "sdpMid": candidate.sdpMid,
                        "sdpMLineIndex": candidate.sdpMLineIndex,
                        "candidate": candidate.candidate
                    }
                })

        # 연결 상태 변경 이벤트 핸들러 추가
        @self.pc.on("connectionstatechange")
        async def on_connectionstatechange():
            print(f"연결 상태 변경: {self.pc.connectionState}")
            if self.pc.connectionState == 'connected':
                print("WebRTC 연결이 성공했습니다. 미디어 트랙 상태 확인 중...")
                # 연결 성공 시 트랙이 활성 상태인지 확인
                if not self.is_track_active and self.cached_track:
                    print("연결 후 트랙 상태 확인 - 트랙 재추가 시도")
                    await self._ensure_track_is_active()
            if self.pc.connectionState == "failed" or self.pc.connectionState == "closed":
                print("연결이 실패하거나 닫혔습니다. 재연결을 시도합니다.")
                await self._reset_connection()

        # 트랙 이벤트 모니터링 (로컬 트랙 상태 추적용)
        @self.pc.on("track")
        def on_track(track):
            print(f"트랙 이벤트 발생: {track.kind}")

            @track.on("ended")
            async def on_ended():
                print("트랙이 종료되었습니다.")
                self.is_track_active = False
                # 트랙이 종료된 경우 재설정 시도
                if self.pc.connectionState == 'connected':
                    await self._ensure_track_is_active()

    async def _ensure_track_is_active(self):
        """
        트랙이 활성 상태인지 확인하고, 필요시 재설정
        """
        try:
            if not self.cached_track:
                print("캐시된 트랙이 없습니다. 트랙 활성화를 건너뜁니다.")
                return

            # 트랙이 정지된 상태인지 확인
            if hasattr(self.cached_track, 'readyState') and self.cached_track.readyState == 'ended':
                print("트랙이 정지된 상태입니다. 재설정이 필요합니다.")
                self.is_track_active = False
                return

            # 이미 활성 상태라면 추가 작업 불필요
            if self.is_track_active:
                print("트랙이 이미 활성 상태입니다.")
                return

            # 현재 트랙을 스트림에 추가
            print("트랙을 다시 추가합니다...")
            self.add_track_to_peer_connection()

            # 오퍼 생성 및 전송
            if self.pc.connectionState == 'connected' and self.selected_user:
                print("연결 후 트랙 추가로 인한 재협상 시작")
                await self.__create_and_send_offer()

        except Exception as e:
            print(f"트랙 활성화 중 오류 발생: {e}")

    async def _reset_connection(self):
        """
        연결 재설정을 위한 메소드
        """
        print(self.is_connecting)
        if self.is_connecting:
            return  # 이미 연결 시도 중이면 무시

        self.is_connecting = True

        try:
            # 트랙 상태 저장
            track_was_active = self.is_track_active

            # 기존 연결 정리
            self.is_track_active = False

            # 기존 연결 닫기 전 sender 정리
            senders = self.pc.getSenders()
            if senders:
                print(f"{len(senders)}개의 sender가 있습니다. 정리합니다.")
                for sender in senders:
                    if sender.track:
                        print(f"sender의 트랙 정보: {sender.track.kind}")

            # 기존 연결 닫기
            await self.pc.close()

            # 새 PeerConnection 생성
            self.pc = get_peer_connection(self.ice_server_config['turn_server'], self.ice_server_config['turn_username'], self.ice_server_config['turn_credential'])
            print("새 PeerConnection 생성 완료")

            self.__register_peer_connection_events()

            # 이전에 트랙이 활성 상태였다면 트랙 다시 추가
            if track_was_active and self.cached_track:
                print("트랙이 활성 상태였으므로 다시 추가합니다.")
                self.add_track_to_peer_connection()

            await self.sio.emit("requestUserList")
        except Exception as e:
            print(f"연결 재설정 중 오류 발생: {e}")

        self.is_connecting = False

    async def _try_reconnect(self):
        """
        소켓 및 피어 연결 재시도
        """
        if self.is_connecting:
            return  # 이미 연결 시도 중이면 무시

        self.is_connecting = True

        print(f"연결 재시도 {self.RETRY_DELAY}초 후에 시도합니다.")

        # 지정된 대기 시간 후 재연결 시도
        await asyncio.sleep(self.RETRY_DELAY)

        try:
            if not self.sio.connected:
                signal_server_url = self.sio.connection_url
                if signal_server_url:
                    await self.sio.connect(signal_server_url, socketio_path="/ws/socket.io")
                else:
                    print("재연결을 위한 서버 URL이 없습니다.")
                    self.is_connecting = False
            else:
                # 소켓은 연결됐지만 PeerConnection이 문제인 경우
                await self._reset_connection()
        except Exception as e:
            print(f"재연결 시도 중 오류 발생: {e}")
            self.is_connecting = False
            # 실패 시 다시 시도
            await self._try_reconnect()

    async def __create_and_send_offer(self):
        try:
            # 오퍼 생성
            offer = await self.pc.createOffer()
            await self.pc.setLocalDescription(offer)

            # 오퍼 전송
            if self.selected_user:
                print(f"오퍼 전송: {self.selected_user}")
                await self.sio.emit("mediaOffer", {
                    "offer": {
                        "type": self.pc.localDescription.type,
                        "sdp": self.pc.localDescription.sdp
                    },
                    "from": self.my_sid,
                    "to": self.selected_user
                })
        except Exception as e:
            print(f"오퍼 생성 및 전송 중 오류 발생: {e}")
            await self._reset_connection()

    def add_track_to_peer_connection(self, track=None):
        """
        WebRTC PeerConnection 에 트랙 추가 메소드
        :param track: 추가할 MediaStreamTrack
        """
        try:
            # 새 트랙이 제공되면 캐시
            if track is not None:
                print(f"새 트랙을 캐시합니다: {track.kind}")
                self.cached_track = track

            # 캐시된 트랙이 없으면 종료
            if self.cached_track is None:
                print("캐시된 트랙이 없어 추가할 수 없습니다.")
                return

            print(f'캐시된 트랙 추가: {self.cached_track.kind}')

            # 현재 sender 확인
            senders = self.pc.getSenders()
            existing_sender = next((s for s in senders if s.track and s.track.kind == self.cached_track.kind), None)

            if existing_sender:
                print(f"기존 sender가 있습니다. 트랙을 교체합니다: {existing_sender}")
                existing_sender.replaceTrack(self.cached_track)
                self.current_sender = existing_sender
            else:
                print("새 sender를 생성하여 트랙을 추가합니다.")
                self.current_sender = self.pc.addTrack(self.cached_track)

            self.is_track_active = True
            print(f"트랙 추가 완료. 활성 상태: {self.is_track_active}")

        except Exception as e:
            print(f"트랙 추가 중 오류 발생: {e}")
            self.is_track_active = False

    async def run(self, signal_server_url):
        """
        WebRTCClient 실행 메소드
        """
        try:
            # 서버에 연결
            print(f"Socket.IO 서버({signal_server_url})에 연결 시도")
            self.is_connecting = True
            await self.sio.connect(signal_server_url, socketio_path="/ws/socket.io")
            self.is_connecting = False
        except Exception as e:
            print(f"서버 연결 중 오류 발생: {e}")
            self.is_connecting = False
            await self._try_reconnect()

    async def close(self):
        """
        WebRTCClient 종료 메소드
        """
        try:
            print("WebRTCClient 종료 중...")
            if self.cached_track:
                print("트랙 정리 중...")
                self.is_track_active = False
                self.cached_track = None

            if self.sio and self.sio.connected:
                print("Socket.IO 연결 종료 중...")
                await self.sio.disconnect()

            if self.pc:
                print("PeerConnection 종료 중...")
                await self.pc.close()

            print("WebRTCClient 종료 완료")
        except Exception as e:
            print(f"클라이언트 종료 중 오류 발생: {e}")


__all__ = ["WebRTCClient"]
