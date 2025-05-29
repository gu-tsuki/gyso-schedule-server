// app.js
const mockApi = require('./mock/data.js');
const request = require('./utils/request.js');

App({
  globalData: {
    userInfo: null,
    isAdmin: false,
    isLoggedIn: false,
    apiUrl: 'https://api.yourworkschedule.com', // 这里替换成你的后端API地址
    useMock: true, // 默认使用模拟数据
    currentViewMode: 'day' // 日程视图模式：day, week, month, year
  },
  onLaunch: function () {
    // 检查用户是否已登录
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const username = wx.getStorageSync('username');
    
    if (isLoggedIn && username) {
      // 如果已登录，设置全局状态
      this.globalData.isLoggedIn = true;
      this.globalData.isAdmin = wx.getStorageSync('isAdmin') || false;
      
      // 获取用户信息
      if (this.globalData.useMock) {
        const mockApi = require('./mock/data.js');
        const userInfo = mockApi.getUserInfoByUsername(username);
        if (userInfo) {
          this.globalData.userInfo = userInfo;
        }
      } else {
        // 真实网络环境下自动获取用户信息
        this.getUserInfo();
      }
    }
    // 注意：不在这里跳转到登录页，让每个页面自己处理登录状态
  },
  
  // 获取用户信息
  getUserInfo: function () {
    const that = this;
    const token = wx.getStorageSync('token');
    
    if (this.globalData.useMock) {
      // 使用模拟数据
      const res = mockApi.getUserInfo(token);
      if (res.statusCode === 200) {
        that.globalData.userInfo = res.data;
        that.globalData.isAdmin = res.data.isAdmin;
      } else {
        // 如果获取信息失败，可能是token过期，跳转到登录页
        wx.removeStorageSync('token');
        wx.redirectTo({
          url: '/pages/login/login',
        });
      }
    } else {
      // 使用真实API
      request.get('/user/info')
        .then(data => {
          that.globalData.userInfo = data;
          that.globalData.isAdmin = data.isAdmin;
        })
        .catch(err => {
          console.error('获取用户信息失败:', err);
          // Token可能已过期，request模块会自动处理跳转到登录页
        });
    }
  },

  // 设置视图模式
  setViewMode: function(mode) {
    this.globalData.currentViewMode = mode;
    // 保存用户偏好设置
    wx.setStorageSync('viewMode', mode);
  },

  // 获取视图模式
  getViewMode: function() {
    // 先尝试从本地存储获取
    const savedMode = wx.getStorageSync('viewMode');
    if (savedMode) {
      this.globalData.currentViewMode = savedMode;
    }
    return this.globalData.currentViewMode;
  }
})

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
