FROM node:20-alpine

# Install system dependencies including ffmpeg
RUN apk add --no-cache \
    git \
    ffmpeg \
    imagemagick \
    libwebp \
    libwebp-tools \
    python3 \
    make \
    g++

WORKDIR /app

# Copy the entire project first (this preserves source code)
COPY . .

# Remove problematic packages from package.json
RUN node -e "\
const fs = require('fs'); \
const pkg = JSON.parse(fs.readFileSync('package.json')); \
['discard-api','pinterest-downloader','ffmpeg-static','@ffmpeg-installer/ffmpeg'].forEach(d => { \
  delete pkg.dependencies?.[d]; \
  delete pkg.devDependencies?.[d]; \
}); \
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Verify the package.json is valid
RUN node -e "JSON.parse(fs.readFileSync('package.json')); console.log('✅ package.json is valid');"

# Set environment variables
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV NODE_OPTIONS="--max-old-space-size=768"

# Install dependencies (using the modified package.json)
RUN npm install --force --loglevel=error

# Create required directories
RUN mkdir -p tmp temp data

EXPOSE 3000

CMD ["node", "--max-old-space-size=768", "--optimize-for-size", "index.js"]
