FROM node:16.13.2 AS builder

RUN mkdir /client
WORKDIR /client

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build


FROM nginx:1.20
COPY nginx.conf /etc/nginx
COPY --from=builder /client/build/ /www/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
