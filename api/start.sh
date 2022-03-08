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

uvicorn app:app --host 0.0.0.0 --port 8000