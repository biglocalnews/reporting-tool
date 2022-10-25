FROM node:16.13.2

RUN mkdir /client
WORKDIR /client

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["tail", "-f", "/dev/null"]
