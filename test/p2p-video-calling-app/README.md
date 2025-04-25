**필요 패키지 설치**

```bash
poetry install
```

**서버 실행**

```bash
poetry run gunicorn -c gunicorn_config.py server:app
```

**브라우저에서 서버 접속**

<https://acslgcs.com:3001/>


**참조**
- https://github.com/matacoder/p2p-video-calling-app
