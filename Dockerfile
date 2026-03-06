FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    ffmpeg \
    imagemagick \
    libwebp \
    libwebp-tools

WORKDIR /app

# Copy package files AND rebrand.js/datamain.txt (needed for postinstall)
COPY package*.json index.js ./

# Remove discard-api from package.json (if present)
RUN node -e "const fs = require('fs'); \
    const pkg = JSON.parse(fs.readFileSync('package.json')); \
    if (pkg.dependencies && pkg.dependencies['discard-api']) delete pkg.dependencies['discard-api']; \
    if (pkg.devDependencies && pkg.devDependencies['discard-api']) delete pkg.devDependencies['discard-api']; \
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Set environment variables to force correct platform for sharp
ENV npm_config_platform=linuxmusl
ENV npm_config_arch=x64

# Install dependencies (scripts will run, including postinstall which uses rebrand.js)
RUN npm install --force --loglevel=error

# Copy the rest of the application
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
