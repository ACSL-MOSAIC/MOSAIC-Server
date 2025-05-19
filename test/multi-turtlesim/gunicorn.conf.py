import os
from datetime import datetime

os.makedirs("/var/log/multi-turtlesim", exist_ok=True)


# gunicorn.conf.py
bind = '0.0.0.0:3002'
workers = 1  # 프로세스 1개로 설정
worker_class = 'uvicorn.workers.UvicornWorker'
keyfile = '/etc/letsencrypt/live/acslgcs.com/privkey.pem'
certfile = '/etc/letsencrypt/live/acslgcs.com/fullchain.pem'

# 작업 디렉토리 설정 (필요한 경우)
chdir = '/home/gist_acsl_master/ai-gcs-server/test/multi-turtlesim'

# 데몬 모드 활성화 (백그라운드 실행)
daemon = True

# syslog로 로그 보내기
accesslog = f'/var/log/multi-turtlesim/access-{datetime.now().strftime("%Y-%m-%d_%H")}'
errorlog = f'/var/log/multi-turtlesim/error-{datetime.now().strftime("%Y-%m-%d_%H")}'
loglevel = 'info'

# 기타 유용한 설정
timeout = 120
graceful_timeout = 30
keepalive = 5

pidfile = '/tmp/gunicorn-multi-turtlesim.pid'
