# Dockerfile padrão de uma Central Oon (gerado pelo oonCore-back).
# Estágio 1: dependências de produção
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
COPY central.config.js ./central.config.js

# Estágio 2: runtime
FROM node:18-alpine
ARG SERVICE_VERSION
ENV SERVICE_VERSION=${SERVICE_VERSION}
WORKDIR /app
COPY --from=builder /app .
RUN mkdir -p uploads
EXPOSE 4000
# Sobe a Central via CLI do Core.
CMD ["npx", "oonCore-back", "start"]
