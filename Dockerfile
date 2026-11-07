FROM node:22-bookworm
RUN apt-get update && apt-get install -y python3 && ln -sf /usr/bin/python3 /usr/bin/python3.11
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
CMD ["npm", "start"]
