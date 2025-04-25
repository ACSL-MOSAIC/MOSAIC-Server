import os
from datetime import datetime

os.makedirs("/var/log/p2p-video-calling", exist_ok=True)


# gunicorn.conf.py
bind = '0.0.0.0:3001'
workers = 1  # 프로세스 1개로 설정
worker_class = 'uvicorn.workers.UvicornWorker'
keyfile = '/etc/letsencrypt/live/acslgcs.com/privkey.pem'
certfile = '/etc/letsencrypt/live/acslgcs.com/fullchain.pem'

# 작업 디렉토리 설정 (필요한 경우)
chdir = '/home/gist_acsl_master/ai-gcs-server/test/p2p-video-calling-app'

# 데몬 모드 활성화 (백그라운드 실행)
daemon = True

# syslog로 로그 보내기
accesslog = f'/var/log/p2p-video-calling/access-{datetime.now().strftime("%Y-%m-%d_%H")}'
errorlog = f'/var/log/p2p-video-calling/error-{datetime.now().strftime("%Y-%m-%d_%H")}'
loglevel = 'info'

# 기타 유용한 설정
timeout = 120
graceful_timeout = 30
keepalive = 5

pidfile = '/tmp/gunicorn-p2p-video-calling.pid'