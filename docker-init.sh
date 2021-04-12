#!/usr/bin/env bash

echo "Starting mock API server and nginx ..."

cd /client
yarn mock-server &

service nginx start
