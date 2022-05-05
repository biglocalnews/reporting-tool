CONTAINER_ID=`docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050-db`
TODAY=`date +"%Y-%m-%d"`
docker exec -it $CONTAINER_ID sh -c "PGPASSWORD=\`cat /run/secrets/5050_db_pass\` pg_dump -h 5050-db -U postgres rt > /rt.dump"
docker cp $CONTAINER_ID:/rt.dump /stornext/backups/5050/rt_${TODAY}.dump
ls -lah /stornext/backups/5050/