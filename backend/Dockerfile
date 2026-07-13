FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
# Expose default API server port
EXPOSE 5000
# Startup server
CMD ["node", "server.js"]
