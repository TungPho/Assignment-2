# =============================
# 1️⃣ Sử dụng image Node chính thức
# =============================
FROM node:18

# =============================
# 2️⃣ Set môi trường là development (có thể đổi production khi deploy)
# =============================
ENV NODE_ENV=development

# =============================
# 3️⃣ Tạo thư mục làm việc trong container
# =============================
WORKDIR /usr/src/app

# =============================
# 4️⃣ Copy file package và cài đặt dependencies
# =============================
COPY package*.json tsconfig.json ./
RUN npm install --legacy-peer-deps

# =============================
# 5️⃣ Cài thêm ts-node và typescript nếu chưa có
# =============================
RUN npm install -g ts-node typescript

# =============================
# 6️⃣ Copy toàn bộ source code
# =============================
COPY . .

# =============================
# 7️⃣ Expose port
# =============================
EXPOSE 3000

# =============================
# 8️⃣ Build code (nếu dùng dist để chạy production)
# =============================
# Nếu bạn chạy trực tiếp bằng ts-node thì không cần RUN npm run build.
# Nếu production build:
# RUN npm run build

# =============================
# 9️⃣ Chạy app sử dụng ts-node hoặc dist
# =============================
CMD ["npm", "start"]
