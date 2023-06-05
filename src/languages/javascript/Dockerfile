FROM node:20-bullseye-slim

WORKDIR /usr/app
COPY ./ /usr/app
RUN npm install

CMD node index.js && echo "hello world"
