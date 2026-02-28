FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Use install instead of ci
RUN npm install --omit=dev

COPY . .

CMD ["node", "index.js"]
