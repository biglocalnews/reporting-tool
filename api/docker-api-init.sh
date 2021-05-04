#!/usr/bin/env bash
set -x

until PGPASSWORD=$db_pw psql -h "$db_host" -U "postgres" -c '\q' "$db_name"; do
    >&2 echo "Postgres database is unavailable, sleeping ..."
    sleep 1
done

>&2 echo "Postgres is up!"

# Run a smoke test to see if the db needs initialization
PGPASSWORD=$db_pw psql -h "$db_host" -U "postgres" -c 'select * from organization;' "$db_name"
st=$?
if [ $st -eq 0 ]; then
    >&2 echo "Database already initialized"
else
    >&2 echo "Database hasn't been initialized yet, doing that now ..."
    if [ "$RT_DUMMY_DATA" = "1" ]; then
        python database.py --dummy-data
    else
        python database.py
    fi
fi
