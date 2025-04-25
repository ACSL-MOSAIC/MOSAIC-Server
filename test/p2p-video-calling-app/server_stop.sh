#!/bin/bash

PID_FILE="/tmp/gunicorn-p2p-video-calling.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "PID 파일이 존재하지 않습니다: $PID_FILE"
    echo "서버가 실행 중이 아닌 것 같습니다."
    exit 1
fi

PID=$(cat "$PID_FILE")

if [ -z "$PID" ]; then
    echo "PID 파일이 비어 있습니다."
    sudo rm -f "$PID_FILE"
    exit 1
fi

if ! ps -p "$PID" > /dev/null; then
    echo "PID $PID를 가진 프로세스가 실행 중이 아닙니다."
    echo "오래된 PID 파일을 제거합니다."
    sudo rm -f "$PID_FILE"
    exit 1
fi

echo "서버 종료 중 (PID: $PID)..."
sudo kill -15 "$PID"

# 프로세스가 정상적으로 종료될 때까지 잠시 기다립니다
sleep 2

# 여전히 실행 중인지 확인
if ps -p "$PID" > /dev/null; then
    echo "정상 종료 실패. 강제 종료 시도 중..."
    sudo kill -9 "$PID"
    sleep 1
fi

if ! ps -p "$PID" > /dev/null; then
    echo "서버가 성공적으로 종료되었습니다."
    sudo rm -f "$PID_FILE"
else
    echo "서버 종료 실패. 수동으로 확인해 주세요."
    exit 1
fi

exit 0