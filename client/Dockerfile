FROM node:15.14.0 AS builder

RUN mkdir /client
WORKDIR /client

COPY package.json yarn.lock ./
RUN yarn install --network-timeout 100000

COPY . .
RUN yarn build

FROM alpine:latest
VOLUME /www
COPY --from=builder /client/build/ /www/

# This container is only meant to provide a static data volume. This entrypoint
# will sleep effectively forever, unless an interrupt is given (at which point
# it will exit quietly).
ENTRYPOINT [ "/bin/sh", "-c", "trap : TERM INT; sleep 9999999999d & wait" ]
