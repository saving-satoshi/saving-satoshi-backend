FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn

COPY . .

RUN yarn build
RUN yarn db:init
RUN yarn db:migrate

EXPOSE 8000

CMD [ "node", "dist/index.js" ]
