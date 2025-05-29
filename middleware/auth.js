const jwt = require('jsonwebtoken');

// JWT密钥，应该存储在环境变量中
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// 验证Token中间件
exports.verifyToken = (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }
  
  // 提取token (Bearer token格式)
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '无效的认证格式' });
  }
  
  try {
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 将用户信息添加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: '无效或过期的令牌' });
  }
};

// 生成Token
exports.generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      username: user.username,
      isAdmin: user.isAdmin 
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token有效期7天
  );
};

// 管理员权限检查中间件
exports.isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
}; 