#!/bin/bash
CONTAINER_ID=`docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050_db`
TODAY=`date +"%Y-%m-%d"`

/usr/bin/docker exec $CONTAINER_ID sh -c "PGPASSWORD=\`cat /run/secrets/rt_db_pw\` pg_dump -h 5050_db -U postgres rt > /rt.dump"
/usr/bin/docker cp $CONTAINER_ID:/rt.dump /stornext/backups/5050/rt_${TODAY}.dump

if [ -s "/stornext/backups/5050/rt_${TODAY}.dump" ] 
then
  python3 -c "import monitoring; log_metric(1)"
else
  python3 -c "import monitoring; log_metric(0)"
fi