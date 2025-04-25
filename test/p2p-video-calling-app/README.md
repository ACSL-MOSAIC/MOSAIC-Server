**필요 패키지 설치**

서버의 경우 sudo 를 앞에 붙여서 실행해야 합니다.
```bash
poetry install
```

**로컬에서 실행**

```bash
poetry run gunicorn -c gunicorn.local.conf.py server:app
```

**서버에서 백엔드 실행**
```bash
sudo ./server_start.sh
```


**브라우저에서 서버 접속**
<https://acslgcs.com:3001/>

**참조**
- https://github.com/matacoder/p2p-video-calling-app
