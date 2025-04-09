**필요 패키지 설치**

```bash
pip install -r requirements.txt
```

**서버 실행**

```bash
cd fastapi_server
sudo uvicorn server:app --host 0.0.0.0 --port 3001 --ssl-keyfile /etc/letsencrypt/live/acslgcs.com/privkey.pem --ssl-certfile /etc/letsencrypt/live/acslgcs.com/fullchain.pem
```

**브라우저에서 서버 접속**

<https://acslgcs.com:3001/>


**참조**
- https://github.com/matacoder/p2p-video-calling-app