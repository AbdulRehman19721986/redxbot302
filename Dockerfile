FROM node:20-alpine

RUN apk add --no-cache git ffmpeg imagemagick webp

WORKDIR /app

COPY package*.json ./
RUN npm install --force --loglevel=error

COPY . .

RUN mkdir -p tmp data

CMD ["npm", "start"]