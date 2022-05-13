CONTAINER_ID=`docker ps --format '{{.ID}}' --filter label=com.docker.swarm.service.name=5050_db`
TODAY=`date +"%Y-%m-%d"`
docker exec -it $CONTAINER_ID sh -c "PGPASSWORD=\`cat /run/secrets/rt_db_pw\` pg_dump -h 5050_db -U postgres rt > /rt.dump"
docker cp $CONTAINER_ID:/rt.dump /stornext/backups/5050/rt_${TODAY}.dump
ls -lah /stornext/backups/5050/