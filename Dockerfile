FROM node:14-alpine

WORKDIR /opt
COPY . /opt

RUN apk add python3 make g++
RUN npm install
RUN npm install --global bunyan

ENTRYPOINT node index.js | bunyan