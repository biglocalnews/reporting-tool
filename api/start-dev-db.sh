#!/usr/bin/env bash
set -ex

docker run -v "`git rev-parse --show-toplevel`/secrets/rt_db_pw:/run/secrets/rt_db_pw"\
 -e POSTGRES_PASSWORD_FILE=/run/secrets/rt_db_pw \
 -e POSTGRES_DB=rt \
 -p 5432:5432 \
 --name=rt_db \
 -it postgres:13.2
