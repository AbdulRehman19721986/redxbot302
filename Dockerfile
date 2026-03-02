FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    ffmpeg \
    imagemagick \
    libwebp \
    libwebp-tools

WORKDIR /app

# Copy package files
COPY package*.json ./

# Remove discard-api from package.json (if present)
RUN node -e "const fs = require('fs'); \
    const pkg = JSON.parse(fs.readFileSync('package.json')); \
    if (pkg.dependencies && pkg.dependencies['discard-api']) delete pkg.dependencies['discard-api']; \
    if (pkg.devDependencies && pkg.devDependencies['discard-api']) delete pkg.devDependencies['discard-api']; \
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Install dependencies without running scripts (postinstall will be run later)
RUN npm install --force --loglevel=error --ignore-scripts

# Copy the rest of the application (including rebrand.js and datamain.txt)
COPY . .

# Now run the postinstall script manually
RUN node rebrand.js

EXPOSE 3000
CMD ["npm", "start"]
