const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { isAdmin } = require('../middleware/auth');

// 获取日程列表
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    
    // 查询条件
    const query = {};
    if (date) {
      query.date = date;
    }
    
    // 查找日程
    const schedules = await Schedule.find(query).sort({ startTime: 1 });
    
    res.json(schedules);
  } catch (error) {
    console.error('获取日程列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当月有日程的日期
router.get('/month', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ message: '缺少年份或月份参数' });
    }
    
    // 构建日期前缀
    const datePrefix = `${year}-${month.padStart(2, '0')}`;
    
    // 查找当月所有日程
    const schedules = await Schedule.find({
      date: { $regex: `^${datePrefix}` }
    }).distinct('date');
    
    res.json(schedules);
  } catch (error) {
    console.error('获取当月日程错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取日程详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找日程
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: '日程不存在' });
    }
    
    res.json(schedule);
  } catch (error) {
    console.error('获取日程详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加日程（仅管理员）
router.post('/', isAdmin, async (req, res) => {
  try {
    const { title, date, startTime, endTime, description, location, participants } = req.body;
    
    // 创建新日程
    const newSchedule = new Schedule({
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      participants,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    });
    
    // 保存日程
    await newSchedule.save();
    
    // 广播日程更新消息
    const broadcast = req.app.get('broadcast');
    broadcast('schedule_update', { action: 'create', schedule: newSchedule });
    
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('添加日程错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新日程（仅管理员）
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, startTime, endTime, description, location, participants } = req.body;
    
    // 更新日程
    const schedule = await Schedule.findByIdAndUpdate(
      id,
      {
        title,
        date,
        startTime,
        endTime,
        description,
        location,
        participants,
        updatedBy: req.user.userId
      },
      { new: true }
    );
    
    if (!schedule) {
      return res.status(404).json({ message: '日程不存在' });
    }
    
    // 广播日程更新消息
    const broadcast = req.app.get('broadcast');
    broadcast('schedule_update', { action: 'update', schedule });
    
    res.json(schedule);
  } catch (error) {
    console.error('更新日程错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除日程（仅管理员）
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 删除日程
    const schedule = await Schedule.findByIdAndDelete(id);
    
    if (!schedule) {
      return res.status(404).json({ message: '日程不存在' });
    }
    
    // 广播日程更新消息
    const broadcast = req.app.get('broadcast');
    broadcast('schedule_update', { action: 'delete', scheduleId: id });
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除日程错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router; 