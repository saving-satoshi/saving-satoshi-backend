FROM node:20-alpine

WORKDIR /usr/app

# Copy the chainstate.json and mempool.json files
COPY ./ /usr/app

RUN npm install --production