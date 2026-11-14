# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.21.0
ARG VITE_API_BASE_URL=https://vlu-campusmarketweb.onrender.com/

FROM node:${NODE_VERSION}-alpine AS build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . ./
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx để xử lý chuyển hướng API
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]