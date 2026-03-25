FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    ffmpeg \
    imagemagick \
    libwebp \
    libwebp-tools

WORKDIR /app

# Copy only package.json (and package-lock.json if present)
COPY package*.json ./

# Remove problematic dependencies that are unavailable or cause issues
RUN node -e "const fs = require('fs'); \
    const pkg = JSON.parse(fs.readFileSync('package.json')); \
    if (pkg.dependencies) { \
        delete pkg.dependencies['discard-api']; \
        delete pkg.dependencies['pinterest-downloader']; \
    } \
    if (pkg.devDependencies) { \
        delete pkg.devDependencies['discard-api']; \
        delete pkg.devDependencies['pinterest-downloader']; \
    } \
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Set environment variables for sharp (if needed)
ENV npm_config_platform=linuxmusl
ENV npm_config_arch=x64

# Install dependencies (no postinstall will run now)
RUN npm install --force --loglevel=error

# Copy the rest of the application source code
COPY . .

EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
