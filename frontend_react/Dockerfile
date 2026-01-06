# Stage 1: Build
FROM node:20-bookworm-slim AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# 執行編譯，產出 dist 資料夾
RUN npm run build

# Stage 2: Production
FROM nginx:stable-alpine AS production-stage
# 複製編譯後的檔案到 Nginx 目錄
COPY --from=build-stage /app/dist /usr/share/nginx/html
# 複製 Nginx 設定檔 (稍後建立)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
