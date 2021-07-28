export https_proxy="http://global-zen.reith.bbc.co.uk:9480/"
docker build -t 5050.ni.bbc.co.uk:8443/5050-api ./api
docker push 5050.ni.bbc.co.uk:8443/5050-api

docker build -f ./client/bbc.dockerfile -t 5050.ni.bbc.co.uk:8443/5050-client ./client
docker push 5050.ni.bbc.co.uk:8443/5050-client

docker service update --force --image 5050.ni.bbc.co.uk:8443/5050-api:latest 5050-api
docker service update --force --image 5050.ni.bbc.co.uk:8443/5050-client:latest 5050-client-prod

#./db_init.sh
