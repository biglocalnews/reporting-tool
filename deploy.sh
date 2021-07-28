export https_proxy="http://global-zen.reith.bbc.co.uk:9480/"
docker build -t 5050.ni.bbc.co.uk:8443/5050-api ./api
docker push 5050.ni.bbc.co.uk:8443/5050-api

docker build -f ./client/bbc.dockerfile -t 5050.ni.bbc.co.uk:8443/5050-client ./client
docker push 5050.ni.bbc.co.uk:8443/5050-client

docker service update --detach --constraint-add no_such_node==true 5050-db
sleep 5
sudo rm -rf /mnt/data/postgres/5050
sudo mkdir /mnt/data/postgres/5050
docker service update --constraint-rm no_such_node==true 5050-db

docker service update --force --image 5050.ni.bbc.co.uk:8443/5050-api:latest 5050-api
docker service update --force --image 5050.ni.bbc.co.uk:8443/5050-client:latest 5050-client-prod

./db_init.sh
