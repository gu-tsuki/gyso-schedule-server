# GYSO音乐季日程表后端服务

这是GYSO音乐季日程表小程序的后端服务，提供API接口和实时数据同步功能。

## 功能特点

- 用户认证与授权
- 日程管理（增删改查）
- WebSocket实时数据同步
- MongoDB数据存储

## 部署指南

### 方法一：本地部署

1. 安装MongoDB
   ```
   https://www.mongodb.com/try/download/community
   ```

2. 安装Node.js依赖
   ```
   npm install
   ```

3. 初始化数据库（创建默认用户）
   ```
   npm run init-db
   ```

4. 启动服务
   ```
   npm start
   ```

### 方法二：Railway部署（免费）

1. 注册Railway账号
   ```
   https://railway.app/
   ```

2. 创建新项目，选择"Deploy from GitHub repo"

3. 连接你的GitHub仓库

4. 添加MongoDB服务
   - 点击"New"
   - 选择"Database"
   - 选择"MongoDB"

5. 设置环境变量
   - `MONGODB_URI`: MongoDB连接字符串（自动从Railway获取）
   - `JWT_SECRET`: 自定义密钥，用于生成JWT令牌

6. 部署完成后，获取应用URL

### 方法三：Render部署（免费）

1. 注册Render账号
   ```
   https://render.com/
   ```

2. 创建Web Service
   - 连接GitHub仓库
   - 选择"Node"环境
   - 构建命令: `npm install`
   - 启动命令: `npm start`

3. 添加环境变量
   - `MONGODB_URI`: MongoDB Atlas连接字符串
   - `JWT_SECRET`: 自定义密钥

4. 部署完成后，获取应用URL

## 配置小程序

1. 打开小程序项目的`app.js`文件

2. 修改以下配置：
   ```javascript
   globalData: {
     useMock: false, // 设为false使用真实后端
     apiUrl: '你的后端服务URL' // 例如: https://gyso-schedule.up.railway.app/api
   }
   ```

## 默认账户

- 管理员账户
  - 用户名: admin
  - 密码: gyso

- 普通用户账户
  - 用户名: user
  - 密码: 0909

## API文档

### 认证

- `POST /api/auth/login`: 用户登录
- `GET /api/auth/user/info`: 获取当前用户信息

### 日程

- `GET /api/schedules`: 获取日程列表
- `GET /api/schedules/month`: 获取当月有日程的日期
- `GET /api/schedules/:id`: 获取日程详情
- `POST /api/schedules`: 添加日程
- `PUT /api/schedules/:id`: 更新日程
- `DELETE /api/schedules/:id`: 删除日程

### 用户

- `GET /api/users`: 获取用户列表
- `GET /api/users/online`: 获取在线用户数
- `POST /api/users`: 创建用户
- `PUT /api/users/:id`: 更新用户信息
- `PUT /api/users/:id/password`: 重置用户密码
- `DELETE /api/users/:id`: 删除用户 