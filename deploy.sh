#!/bin/bash

export http_proxy="http://global-zen.reith.bbc.co.uk:9480/"
export https_proxy="http://global-zen.reith.bbc.co.uk:9480/"

curl -SL https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-linux-x86_64 -o docker-compose
chmod +x ./docker-compose

./docker-compose -f docker-compose.yml -f docker-compose.prod.yml -p 5050 build --build-arg HTTP_PROXY=$http_proxy --build-arg HTTPS_PROXY=$https_proxy

docker push 5050.ni.bbc.co.uk:8443/5050-api-prod
docker push 5050.ni.bbc.co.uk:8443/5050-client-prod

docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml 5050

rm ./docker-compose
