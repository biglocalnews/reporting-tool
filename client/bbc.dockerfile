FROM node:15.14.0 AS builder

RUN mkdir /client
WORKDIR /client

COPY package.json yarn.lock ./
RUN yarn install --network-timeout 100000

COPY . .
RUN yarn build


FROM nginx:1.20
COPY nginx.conf /etc/nginx
COPY --from=builder /client/build/ /www/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
