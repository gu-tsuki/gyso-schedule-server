const mongoose = require('mongoose');
const User = require('./models/User');

// 连接MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gyso_schedule';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 创建默认管理员账户
const createDefaultAdmin = async () => {
  try {
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
    
    console.log('初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('初始化数据库错误:', error);
    process.exit(1);
  }
};

// 执行初始化
createDefaultAdmin(); 