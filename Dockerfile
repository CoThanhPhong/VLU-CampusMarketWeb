# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.21.0

FROM node:${NODE_VERSION}-alpine AS dependencies
WORKDIR /app
COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node backend/ ./
USER node
EXPOSE 5000
CMD ["node", "server.js"]
