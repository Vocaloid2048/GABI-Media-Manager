# 使用官方 Node.js 基礎映像檔
FROM node:20-bookworm-slim

# 設定工作目錄
WORKDIR /app

# 複製 package.json 與 package-lock.json
COPY package*.json ./

# 安裝相依套件
# 使用 npm ci 以確保版本一致性
RUN npm ci --only=production 

# 複製其餘的程式碼
COPY . .

# 建立必要的資料夾
RUN mkdir -p db logs backups/main backups/sub GABI/Videos GABI/Thumbs GABI/Avatars Temp

# 設定環境變數 (可以在 docker-compose.yml 中覆寫)
ENV PORT=3000
ENV NODE_ENV=production

# 暴露埠號
EXPOSE 3000

# 啟動應用程式
CMD ["npm", "start"]
