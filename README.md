# BBC 5050 Reporting Tool

### Built With

- React using Typescript
- Python3

## Getting Started

Frontend
[/client](https://github.com/stanford-policylab/bbc-50-50/tree/main/client)

Backend API
[/api](https://github.com/stanford-policylab/bbc-50-50/tree/main/api)

### Docker compose

The entire app (including database) can be started with docker-compose:

```
docker-compose up --build
```

The app will be available at `http://localhost/`. See the `.env` file in the
root directory for more configuration options available here.

Docker compose should *not* be used for production; it's better just for a
quick demo.

The secrets used for development are in `./secrets/`; these should be replaced
in production.

### Docker Swarm

You can deploy in production using docker swarm:

```
set -a && source .env && set +a
docker deploy stack -c docker-compose.yml rt
```

This will deploy the service based on the `.env` file. The `.env` file in the
repo is a good starting place, but you should override some of those values
with secure secrets for production.

The `api` and `nginx` services are both scalable if you need to add more
replicas. (You never need to scale the `client` service as it is just static
assets that are served by `nginx`.)

NOTE: Currently you are not able to replicate postgres with this configuration.
You should **not** try to increase the replicas, as it will not behave as you
hope. We will add support for this over time.
