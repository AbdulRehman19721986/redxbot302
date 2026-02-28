FROM node:20-alpine

# Install git (required for GitHub dependencies)
RUN apk add --no-cache git

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the application
COPY . .

# Start the bot (as defined in your package.json)
CMD ["npm", "start"]
