#!/usr/bin/env bash
set -ex

if [[ $(docker ps -a --filter "name=^rt_db$" --format '{{.Names}}') == "rt_db" ]]; then
    # Re-using existing database container.
    # 
    # If you want to start fresh, run `docker rm rt_db` and re-rerun this script.
    docker start rt_db
else
    # Starting fresh database container.
    docker run -v "`git rev-parse --show-toplevel`/secrets/rt_db_pw:/run/secrets/rt_db_pw"\
     -e POSTGRES_PASSWORD_FILE=/run/secrets/rt_db_pw \
     -e POSTGRES_DB=rt \
     -p 5432:5432 \
     --name=rt_db \
     -it postgres:13.2
fi
