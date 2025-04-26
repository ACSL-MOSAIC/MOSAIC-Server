# 개요
웹캠 비디오 스트림을 WebRTC 로 전송하는 애플리케이션입니다.

# 실행 전 준비사항
```bash
poetry install
```

# 실행 시 인자
1. --signal_server: 시그널링을 위한 서버 주소 (예시: https://acslgcs.com:3001)
2. --turn: TURN 서버 주소 (예시: turn.acslgcs.com:3478)
3. --username: TURN 서버 사용자 이름
4. --credential: TURN 서버 비밀번호

# 실행 방법
```bash
poetry run python local_webcam.py --signal_server 'https://acslgcs.com:3001' --turn '34.64.72.104:3478' --username 'gistacsl' --credential 'qwqw!12321'
```
