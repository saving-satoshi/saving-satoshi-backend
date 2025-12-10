FROM node:20-alpine

WORKDIR /usr/app

COPY package.json package-lock.json* ./
RUN npm install --production

CMD ["node", "/usr/app/user/index.js"]