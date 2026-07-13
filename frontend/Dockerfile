# Multi-stage build for production-ready frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Pass build-time environment variables
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_OCR_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV REACT_APP_OCR_BASE_URL=${REACT_APP_OCR_BASE_URL}
RUN npm run build

# Nginx production environment
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
