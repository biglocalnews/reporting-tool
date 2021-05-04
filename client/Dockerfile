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

# No point to the entry, just a command that'll run forever
ENTRYPOINT [ "tail", "-f", "/dev/null" ]
