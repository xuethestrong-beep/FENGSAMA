FROM node:22-bookworm
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg curl && curl -fsSL https://deno.land/install.sh | sh && mv /root/.deno/bin/deno /usr/local/bin/deno
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
CMD ["npm", "start"]
