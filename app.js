const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedules');
const userRoutes = require('./routes/users');
const { verifyToken } = require('./middleware/auth');

// 创建Express应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 连接MongoDB数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gyso_schedule';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/schedules', verifyToken, scheduleRoutes);
app.use('/api/users', verifyToken, userRoutes);

// 存储连接的客户端
const clients = {};

// WebSocket处理
io.on('connection', (socket) => {
  console.log('新客户端连接:', socket.id);
  
  // 处理认证
  socket.on('auth', (data) => {
    try {
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'your_jwt_secret');
      const userId = decoded.userId;
      
      // 存储用户连接
      clients[userId] = socket.id;
      socket.userId = userId;
      socket.isAdmin = decoded.isAdmin;
      
      console.log(`用户 ${userId} 已认证`);
    } catch (error) {
      console.error('WebSocket认证失败:', error);
      socket.disconnect();
    }
  });
  
  // 处理断开连接
  socket.on('disconnect', () => {
    console.log('客户端断开连接:', socket.id);
    if (socket.userId) {
      delete clients[socket.userId];
    }
  });
});

// 导出广播函数，用于在其他模块中发送WebSocket消息
const broadcast = (type, data, targetUserIds = null) => {
  if (targetUserIds) {
    // 发送给特定用户
    if (Array.isArray(targetUserIds)) {
      targetUserIds.forEach(userId => {
        const socketId = clients[userId];
        if (socketId) {
          io.to(socketId).emit('message', { type, ...data });
        }
      });
    } else {
      // 单个用户
      const socketId = clients[targetUserIds];
      if (socketId) {
        io.to(socketId).emit('message', { type, ...data });
      }
    }
  } else {
    // 广播给所有连接的客户端
    io.emit('message', { type, ...data });
  }
};

// 导出广播函数，供其他模块使用
app.set('broadcast', broadcast);

// 健康检查端点
app.get('/', (req, res) => {
  res.send('GYSO日程服务器运行正常');
});

// 启动服务器并初始化数据库
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 启动服务器
    server.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
    
    // 等待MongoDB连接成功
    console.log('尝试初始化数据库...');
    
    // 导入User模型
    const User = require('./models/User');
    
    // 检查是否已存在管理员账户
    const adminExists = await User.findOne({ isAdmin: true });
    
    if (!adminExists) {
      // 创建默认管理员
      const admin = new User({
        username: 'admin',
        password: 'gyso', // 会自动加密
        name: '管理员',
        isAdmin: true
      });
      
      await admin.save();
      console.log('默认管理员账户已创建');
    } else {
      console.log('管理员账户已存在，跳过创建');
    }
    
    // 创建默认普通用户
    const userExists = await User.findOne({ username: 'user' });
    
    if (!userExists) {
      // 创建默认用户
      const user = new User({
        username: 'user',
        password: '0909', // 会自动加密
        name: '普通用户',
        isAdmin: false
      });
      
      await user.save();
      console.log('默认普通用户账户已创建');
    } else {
      console.log('普通用户账户已存在，跳过创建');
    }
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('服务器启动或数据库初始化失败:', error);
  }
};

// 执行启动函数
startServer();

module.exports = app;