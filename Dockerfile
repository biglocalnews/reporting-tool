FROM node:15.14.0

RUN mkdir /client
WORKDIR /client

COPY client/package.json client/yarn.lock ./
RUN yarn install --network-timeout 100000 --verbose

ADD client/ /client/

RUN yarn mock-server &
EXPOSE 3000
EXPOSE 4000
ENTRYPOINT ["yarn", "start:mock"]
