**FastAPI 설치**

```bash
pip install fastapi
```

**서버 구동**
```bash
uvicorn server:app --host 0.0.0.0 --port 3000
```

**브라우저에서 서버 접속**

<https://acslgcs.com:3000/>

**동작 방식**
- 서버 구동 후, 로봇(서버와 다른 HW)에서 ai-gcs/test/remote_control/robot.py 실행
- 서버 웹에 방향키 나타남
- 방향키 클릭을 통해 원격 로봇 제어 가능