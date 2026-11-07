FROM node:22-bookworm
RUN apt-get update && apt-get install -y python3 ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
CMD ["npm", "start"]
