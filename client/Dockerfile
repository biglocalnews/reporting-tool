FROM node:16.13.2 AS builder

RUN mkdir /client
WORKDIR /client

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build


FROM nginx:1.20
COPY nginx.stack.conf /etc/nginx/nginx.conf
COPY --from=builder /client/build/ /www/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
