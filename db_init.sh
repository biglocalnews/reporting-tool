#!/bin/bash
docker service update --detach --constraint-add no_such_node==true 5050-db
sleep 5

rm -rf /mnt/data/postgres/5050
mkdir /mnt/data/postgres/5050

docker service update --constraint-rm no_such_node==true 5050-db

docker exec -it `docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050-api` sh -c 'psql -h 5050-db --user postgres -c "create database rt"; python3 /app/database.py --dummy-data'
