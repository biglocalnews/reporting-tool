#!/bin/bash

export http_proxy="http://global-zen.reith.bbc.co.uk:9480/"
export https_proxy="http://global-zen.reith.bbc.co.uk:9480/"

DOCKER_PLUGINS_PATH=$HOME/.docker/cli-plugins
COMPOSE=$DOCKER_PLUGINS_PATH/docker-compose

mkdir -p $DOCKER_PLUGINS_PATH

#if [ ! -f "$COMPOSE" ]; then
curl -SL https://github.com/docker/compose/releases/download/v2.6.1/docker-compose-linux-x86_64 -o $COMPOSE
chmod +x $COMPOSE
#fi

docker compose -f docker-compose.yml -f docker-compose.prod.yml -p 5050 build --build-arg HTTP_PROXY=$http_proxy --build-arg HTTPS_PROXY=$https_proxy

docker push 5050.ni.bbc.co.uk:8443/5050-api-prod
docker push 5050.ni.bbc.co.uk:8443/5050-client-prod
docker push 5050.ni.bbc.co.uk:8443/5050-backup-prod

docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml 5050

docker service update --force --image 5050.ni.bbc.co.uk:8443/5050-api-prod:latest 5050_api
sleep 5
docker service update --force --image 5050.ni.bbc.co.uk:8443/5050-client-prod:latest 5050_client
#docker service update --force --image 5050.ni.bbc.co.uk:8443/5050-backup-prod:latest 5050_backup
