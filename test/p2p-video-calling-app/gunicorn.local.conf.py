# gunicorn.conf.py
bind = '127.0.0.1:3001'
workers = 1  # 프로세스 1개로 설정
worker_class = 'uvicorn.workers.UvicornWorker'

# syslog로 로그 보내기
loglevel = 'info'

# 기타 유용한 설정
timeout = 120
graceful_timeout = 30
keepalive = 5
