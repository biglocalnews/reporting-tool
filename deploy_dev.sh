#!/bin/bash

#export http_proxy="http://global-zen.reith.bbc.co.uk:9480/"
#export https_proxy="http://global-zen.reith.bbc.co.uk:9480/"

curl -SL https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-linux-x86_64 -o docker-compose
chmod +x ./docker-compose

./docker-compose -f docker-compose.yml -f docker-compose.dev.yml -p 5050 build

docker push 5050.ni.bbc.co.uk:8443/5050-api-dev
docker push 5050.ni.bbc.co.uk:8443/5050-client-dev

docker stack deploy -c docker-compose.yml -c docker-compose.dev.yml -c docker-compose.haproxy.yml 5050
docker stack deploy -c docker-compose.test.yml 5051

rm ./docker-compose