#!/bin/bash
docker exec -it `docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050-api` sh -c 'psql -h 5050-db --user postgres -c "create database rt"; python3 /app/database.py --dummy-data'
