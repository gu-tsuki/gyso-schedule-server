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
