#!/bin/bash

#mkdir just in case it doesnt exist
mkdir -p /etc/cron.d

#set -f to stop the asterisk expanding to file list
set -f
echo "*/1 * * * * root /app/db_backup.sh" > /etc/cron.d/backup

python3 monitoring.py

cron

sleep infinity