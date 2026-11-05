const jwt = require('jsonwebtoken');

// 1. Middleware xác thực Token
const verifyToken = (req, res, next) => {
  // Lấy header Authorization từ request client gửi lên
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Không tìm thấy Token xác thực, vui lòng đăng nhập lại!' 
    });
  }

  // Cắt lấy phần token phía sau chữ "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    // Giải mã token bằng secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'VLU_SECRET_KEY');
    
    // Gán thông tin đã giải mã vào req.user để controller sử dụng
    req.user = decoded; 
    
    next(); // Cho phép đi tiếp vào Controller hoặc Middleware tiếp theo
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token không hợp lệ hoặc đã hết hạn!' 
    });
  }
};

// 2. Middleware kiểm tra quyền Admin (ĐÃ TÁCH RA NGOÀI HOÀN TOÀN)
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // Cho phép đi tiếp
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Bạn không có quyền truy cập (Yêu cầu tài khoản Admin)!' 
    });
  }
};

// Export cả hai hàm để bên file Route có thể gọi chung
module.exports = { verifyToken, isAdmin };