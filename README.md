# Reporting Tool [RT]

### Built With

- Typescript: React, Apollo, AntD
- Python3: FastAPI, Ariadne (GraphQL), SQLAlchemy
- Postgres

## More info

Frontend
[/client](https://github.com/stanford-policylab/bbc-50-50/tree/main/client)

Backend API
[/api](https://github.com/stanford-policylab/bbc-50-50/tree/main/api)

## Deployment

The entire app (including database) can be started with docker-compose:

```
docker-compose up --build
```

The app will be available at `http://localhost/`. See the `.env` file in the
root directory for more configuration options available here.

Docker compose should _not_ be used for production; it's better just for a
quick demo.

The secrets used for development are in `./secrets/`; these should be replaced
in production.

### Production

You can deploy in production using docker swarm:

```
set -a && source .env && set +a
docker deploy stack -c docker-compose.yml -c docker-compose.prod.yml rt
```

This will deploy the service based on the `.env` file, the `docker-compose.yml`,
and any overrides you have in a custom `docker-compose.prod.yml` file.

#### Overrides

The `.env` and `docker-compose.yml` provide a config that works well for a demo
or test deployment, but you should add some overrides for production. A minimal
`docker-compose.prod.yml` might look like:

```yml
version: "3.9"

# Use a persistent local volume for postgres data
volumes:
  pgdata:
    driver: local
    driver_opts:
      o: bind
      type: none
      device: /path/to/my/db/data/

# Use strong secrets
secrets:
  db-password:
    file: ./secrets/db-password.prod
  app-secret:
    file: ./secrets/app-secret.prod
```

The `.env` file can be used to configure the Python API as well, e.g. to
provide settings for the SMTP server for sending email. See both the
`./api/settings.py` file for what settings are available, and the `.env` for
examples of how to override them with environment variables.

#### Scaling

The `api` and `nginx` services are both scalable if you need to add more
replicas. (You never need to scale the `client` service as it is just static
assets that are served by `nginx`.)

NOTE: Currently you are not able to replicate postgres with this configuration.
You should **not** try to increase the replicas, as it will not behave as you
hope. We will add support for high-availability eventually.

## License

[Apache License 2.0](LICENSE)
