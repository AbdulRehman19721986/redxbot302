FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (omit dev packages as recommended)
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Start the bot
CMD ["node", "index.js"]
