FROM node:20-alpine

# Install required system dependencies
RUN apk add --no-cache \
    git \
    ffmpeg \
    imagemagick \
    libwebp \
    libwebp-tools

WORKDIR /app

COPY package*.json ./
RUN npm install --force --loglevel=error

COPY . .

RUN mkdir -p tmp data

CMD ["npm", "start"]
