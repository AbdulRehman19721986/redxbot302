FROM node:20-alpine

RUN apk add --no-cache \
    git \
    ffmpeg \
    imagemagick \
    libwebp \
    libwebp-tools

WORKDIR /app

# Copy package files AND rebrand.js + datamain.txt so postinstall can run
COPY package*.json rebrand.js datamain.txt ./
RUN npm install --force --loglevel=error

# Copy the rest of the application
COPY . .

RUN mkdir -p tmp data

CMD ["npm", "start"]
