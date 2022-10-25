#!/bin/bash

docker exec -it $(docker ps --format '{{.ID}}' --filter label=edu.stanford.policylab.rt.service=api) sh -c 'python3 /app/test_users.py'
