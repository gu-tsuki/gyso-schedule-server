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