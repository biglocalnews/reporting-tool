FROM haproxy
WORKDIR /etc/ssl/certs
COPY roots.crt .
WORKDIR /var/lib/haproxy
COPY localhost.crt . 