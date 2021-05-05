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

The app will be available at `http://localhost/`. 

The secrets used for development are in `./secrets/`; these should be replaced
in production.

TODO - add more information about production deployment (using swarm?)
