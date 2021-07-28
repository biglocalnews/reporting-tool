#!/bin/bash
docker exec -it `docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050-api` sh -c 'psql -c "create database rt" && python3 /app/api/database.py --dummy-data'
