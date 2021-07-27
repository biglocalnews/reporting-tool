#!/bin/bash

#export http_proxy="http://global-zen.reith.bbc.co.uk:9480/"
#export https_proxy="http://global-zen.reith.bbc.co.uk:9480/"

DOCKER_PLUGINS_PATH=$HOME/.docker/cli-plugins
COMPOSE=$DOCKER_PLUGINS_PATH/docker-compose

mkdir -p $DOCKER_PLUGINS_PATH

if [ ! -f "$COMPOSE" ]; then
    curl -SL https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-linux-x86_64 -o $COMPOSE
    chmod +x $COMPOSE
fi

docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.haproxy.yml  -p 5050 build

docker push 5050.ni.bbc.co.uk:8443/5050-haproxy-dev

docker stack deploy -c docker-compose.yml -c docker-compose.dev.yml -c docker-compose.haproxy.yml 5050

docker service update --force --image 5050.ni.bbc.co.uk:8443/5050-haproxy-dev:latest 5050_haproxy