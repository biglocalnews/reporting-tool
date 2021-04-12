FROM node:15.14.0

RUN apt update && apt install -y nginx
RUN rm -v /etc/nginx/nginx.conf

RUN mkdir /client
WORKDIR /client

COPY client/package.json client/yarn.lock ./
RUN yarn install --network-timeout 100000

ADD client/ /client/
RUN yarn build

COPY nginx.conf /etc/nginx/
RUN service nginx start

EXPOSE 80
ENTRYPOINT ["yarn", "mock-server"]
