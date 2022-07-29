#!/usr/bin/bash
source /app/.env.sh
export AWS_SHARED_CREDENTIALS_FILE=/root/.aws/credentials

rm /app/rt.dump

set -e

CONTAINER_ID=`docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050_db`
TODAY=`date +"%Y-%m-%d"`

echo "Running job $TODAY"

/usr/bin/docker exec $CONTAINER_ID sh -c "PGPASSWORD=\`cat /run/secrets/rt_db_pw\` pg_dump -h 5050_db -U postgres rt > /rt.dump"
/usr/bin/docker cp $CONTAINER_ID:/rt.dump /app
/usr/local/bin/aws s3 cp /app/rt.dump s3://5050-db-backups/rt_${TODAY}.dump

export PYTHONPATH=/app

/usr/bin/python3 -c "import monitoring; monitoring.log_metric(1)"

echo "done!"