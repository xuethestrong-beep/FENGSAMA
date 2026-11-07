FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages --no-cache-dir yt-dlp --upgrade

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# FIXED: absolute path + writable
RUN mkdir -p /app/cache && chmod -R 777 /app/cache

CMD ["npm", "start"]
