# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# En producción nginx es el único entry point.
# /api/* se proxea nginx → API Gateway (:8080).
# Mensajería (:3006) y mascotas (:3003) usan el fallback a localhost
# porque esos puertos están expuestos directamente al host.
ENV VITE_API_GATEWAY_URL=""

RUN npx vite build

# ── Stage 2: production (nginx) ──────────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
