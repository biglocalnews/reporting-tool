#!/bin/bash

apt update -y && apt install krb5-config libkrb5-dev krb5-user cron cifs-utils -y

echo "[libdefaults]
  default_realm = NATIONAL.CORE.BBC.CO.UK
  kdc_timesync = 1
  ccache_type = 4
  forwardable = true
  proxiable = true
  ticket_lifetime = 6h
  renew_lifetime = 7d

  # The following libdefaults parameters are only for Heimdal Kerberos.
  fcc-mit-ticketflags = true
 
[realms]
NATIONAL.CORE.BBC.CO.UK = {
   kdc = bgbbedc1001.national.core.bbc.co.uk
   admin_server = bgbbedc1001.national.core.bbc.co.uk
}" > /etc/krb5.conf
