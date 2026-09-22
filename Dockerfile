# Stage 1: Build application
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments for Vite env baking
ARG VITE_NAVIDROME_URL_LAN
ARG VITE_NAVIDROME_URL_TAILSCALE
ARG VITE_NAVIDROME_USERNAME
ARG VITE_NAVIDROME_PASSWORD

ENV VITE_NAVIDROME_URL_LAN=$VITE_NAVIDROME_URL_LAN
ENV VITE_NAVIDROME_URL_TAILSCALE=$VITE_NAVIDROME_URL_TAILSCALE
ENV VITE_NAVIDROME_USERNAME=$VITE_NAVIDROME_USERNAME
ENV VITE_NAVIDROME_PASSWORD=$VITE_NAVIDROME_PASSWORD

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
