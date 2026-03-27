FROM node:20-alpine

# Install system dependencies (including ffmpeg)
RUN apk add --no-cache \
    git \
    ffmpeg \
    imagemagick \
    libwebp \
    libwebp-tools \
    jq

WORKDIR /app

# Copy only package.json first
COPY package.json ./

# Remove problematic dependencies from all sections of package.json
RUN sed -i '/"discard-api"/d; /"pinterest-downloader"/d; /"ffmpeg-static"/d' package.json && \
    jq 'del(.dependencies["discard-api"], .dependencies["pinterest-downloader"], .dependencies["ffmpeg-static"], \
             .devDependencies["discard-api"], .devDependencies["pinterest-downloader"], .devDependencies["ffmpeg-static"], \
             .optionalDependencies["discard-api"], .optionalDependencies["pinterest-downloader"], .optionalDependencies["ffmpeg-static"], \
             .peerDependencies["discard-api"], .peerDependencies["pinterest-downloader"], .peerDependencies["ffmpeg-static"])' \
        package.json > package.json.tmp && \
    mv package.json.tmp package.json && \
    cat package.json   # (optional) verify the cleaned file

# Remove any existing lockfiles to avoid old references
RUN rm -f package-lock.json npm-shrinkwrap.json

# Environment variables for sharp (if needed)
ENV npm_config_platform=linuxmusl
ENV npm_config_arch=x64

# Install dependencies:
#   --no-optional      : skip optional deps (ffmpeg-static is often optional)
#   --no-package-lock  : don't generate a new lockfile
#   FFMPEG_SKIP_INSTALL=1 : extra safety for any ffmpeg-static that sneaks in
RUN FFMPEG_SKIP_INSTALL=1 npm install --force --no-package-lock --no-optional --loglevel=error

# Copy the rest of the application source code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
