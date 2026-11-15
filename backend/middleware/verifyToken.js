const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy Token trong Cookie, vui lòng đăng nhập lại!'
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn!'
    });
  }

  if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
    return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ' });
  }

  try {
    const user = await User.findById(decoded.id).select('role');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không còn tồn tại' });
    }

    req.user = { ...decoded, id: user._id.toString(), role: user.role };
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Không thể xác thực tài khoản' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Bạn không có quyền truy cập (Yêu cầu tài khoản Admin)!'
  });
};

module.exports = { verifyToken, isAdmin };