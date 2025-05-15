#!/bin/bash

# 서버 시작 스크립트
sudo poetry run gunicorn -c gunicorn.conf.py server:app
