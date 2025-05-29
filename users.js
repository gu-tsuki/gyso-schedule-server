const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAdmin } = require('../middleware/auth');

// 获取在线用户数量
router.get('/online', async (req, res) => {
  try {
    // 计算最近30分钟内活跃的用户为"在线"
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // 查询管理员和普通用户数量
    const adminCount = await User.countDocuments({
      isAdmin: true,
      lastLogin: { $gt: thirtyMinutesAgo }
    });
    
    const userCount = await User.countDocuments({
      isAdmin: false,
      lastLogin: { $gt: thirtyMinutesAgo }
    });
    
    res.json({
      adminCount,
      userCount
    });
  } catch (error) {
    console.error('获取在线用户数量错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户列表（仅管理员）
router.get('/', isAdmin, async (req, res) => {
  try {
    // 查询所有非管理员用户
    const users = await User.find({ isAdmin: false }).select('-password');
    
    res.json(users);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建用户（仅管理员）
router.post('/', isAdmin, async (req, res) => {
  try {
    const { username, password, name, isAdmin } = req.body;
    
    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 创建新用户
    const newUser = new User({
      username,
      password,
      name,
      isAdmin: isAdmin || false
    });
    
    // 保存用户
    await newUser.save();
    
    // 广播用户更新消息
    const broadcast = req.app.get('broadcast');
    broadcast('user_update', { action: 'create' });
    
    // 返回用户信息（不包含密码）
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      name: newUser.name,
      isAdmin: newUser.isAdmin
    };
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户（仅管理员）
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isAdmin } = req.body;
    
    // 更新用户
    const user = await User.findByIdAndUpdate(
      id,
      { name, isAdmin },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 广播用户更新消息
    const broadcast = req.app.get('broadcast');
    broadcast('user_update', { action: 'update' });
    
    res.json(user);
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 重置用户密码（仅管理员）
router.put('/:id/password', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    // 查找用户
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.json({ message: '密码重置成功' });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 修改管理员密码
router.put('/admin/password', isAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // 查找当前管理员
    const admin = await User.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 验证当前密码
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: '当前密码不正确' });
    }
    
    // 更新密码
    admin.password = newPassword;
    await admin.save();
    
    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改管理员密码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除用户（仅管理员）
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 删除用户
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 广播用户更新消息
    const broadcast = req.app.get('broadcast');
    broadcast('user_update', { action: 'delete' });
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 