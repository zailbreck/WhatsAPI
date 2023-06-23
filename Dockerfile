FROM node:18-alpine
WORKDIR /usr/app
COPY package.json .
RUN npm install -g npm@9.7.2
COPY . .