#!/bin/bash

export HTTP_PROXY=
export HTTPS_PROXY=

cd alembic

alembic upgrade head

cd ..

python3 monitoring.py

gunicorn --workers=$GUNICORN_WORKERS --bind=0.0.0.0:8000 --worker-class=uvicorn.workers.UvicornWorker app:app
