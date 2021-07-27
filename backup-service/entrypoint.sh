#!/usr/bin/bash

rm -rf /etc/cron.*/*

printenv | sed 's/^\(.*\)$/export \1/g' > /app/.env.sh

#set -f to stop the asterisk expanding to file list
set -f
echo "0 0 * * * root timeout 5m /app/db_backup.sh" > /etc/crontab

python3 monitoring.py

cron -f -l 2