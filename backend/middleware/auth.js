const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Lấy token từ cookie (ưu tiên). 
  // Bạn có thể giữ thêm vế sau || ... nếu muốn hỗ trợ cả cách gửi qua header cũ.
  const token = req.cookies?.token || (req.header('Authorization') || '').replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token, vui lòng đăng nhập lại' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "VLU_SECRET_KEY");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};