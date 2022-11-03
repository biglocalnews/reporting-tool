FROM node:16.18.0

# RUN apt update -y && \
    #apt install -y libcairo2-dev libjpeg-dev libgif-dev libpango1.0-dev libpangocairo-1.0-0

RUN mkdir /client
WORKDIR /client

COPY package.json .yarnrc yarn.lock ./
COPY node_modules_offline_cache ./
RUN yarn install --frozen-lockfile --production

COPY . .
RUN yarn build

CMD ["tail", "-f", "/dev/null"]
