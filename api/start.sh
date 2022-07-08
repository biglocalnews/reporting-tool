#!/bin/bash

#kerberos ticket appears to only be valid for 10hrs and doesnt seem to renew
export initCMD="kinit -kt /run/secrets/ni-app-tig.keytab ni-app-tig@NATIONAL.CORE.BBC.CO.UK && klist >> /kinit.log 2>&1"
#mkdir just in case it doesnt exist
mkdir -p /etc/cron.d
#set -f to stop the asterisk expanding to file list
set -f
echo "0 */4 * * * root $initCMD" > /etc/cron.d/kinitr

eval $initCMD

klist -e

cron

export HTTP_PROXY=http://global-zen.reith.bbc.co.uk:9480/
export HTTPS_PROXY=http://global-zen.reith.bbc.co.uk:9480/
export NO_PROXY=.ni.bbc.co.uk,laravel-api.mobileapps.bbc.co.uk

cd alembic

alembic upgrade head

cd ..

python3 monitoring.py

gunicorn --workers=$GUNICORN_WORKERS --bind=0.0.0.0:8000 --worker-class=uvicorn.workers.UvicornWorker app:app
#uvicorn app:app --workers 32 --host 0.0.0.0 --port 8000