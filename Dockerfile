# 使用官方 Node.js 镜像
FROM node:18

# 创建工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制所有项目文件
COPY . .

# 暴露端口（和 app.js 里一致）
EXPOSE 3000

# 启动服务
CMD ["npm", "run", "start"] 