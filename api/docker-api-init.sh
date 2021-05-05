#!/usr/bin/env bash
set -x

# Create the passfile in the format `host:port:database:user:password`
echo "$db_host:5432:$db_name:postgres" > .pgpass.tmp
# Avoid echoing the password to the screen here
paste -d':' .pgpass.tmp /run/secrets/db_pw > .pgpass
chmod 600 .pgpass
rm .pgpass.tmp

until PGPASSFILE=.pgpass psql -h "$db_host" -U "postgres" -c '\q' "$db_name"; do
    >&2 echo "Postgres database is unavailable, sleeping ..."
    sleep 1
done

>&2 echo "Postgres is up!"

# Run a smoke test to see if the db needs initialization
PGPASSFILE=.pgpass psql -h "$db_host" -U "postgres" -c 'select * from organization;' "$db_name"
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
