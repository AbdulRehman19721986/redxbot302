FROM node:20-alpine

# Install system dependencies including ffmpeg (for Heroku Docker builds)
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

COPY package*.json ./

# Clean problematic deps before install
# Remove ffmpeg-static and @ffmpeg-installer/ffmpeg to avoid architecture issues
# Also remove any other problematic packages as needed
RUN node -e "\
const fs = require('fs'); \
const pkg = JSON.parse(fs.readFileSync('package.json')); \
['discard-api','pinterest-downloader','ffmpeg-static','@ffmpeg-installer/ffmpeg'].forEach(d => { \
  delete pkg.dependencies?.[d]; \
  delete pkg.devDependencies?.[d]; \
}); \
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Set path to system ffmpeg
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV NODE_OPTIONS="--max-old-space-size=460"

# Optional: these were for ffmpeg-static, but we removed it; keep if desired
# ENV npm_config_platform=linuxmusl
# ENV npm_config_arch=x64

RUN npm install --force --loglevel=error

COPY . .

# Create required directories
RUN mkdir -p tmp temp data

EXPOSE 3000

CMD ["node", "--max-old-space-size=460", "--optimize-for-size", "index.js"]
