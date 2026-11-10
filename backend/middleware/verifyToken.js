const jwt = require('jsonwebtoken');

// 1. Middleware xác thực Token hoàn toàn lấy từ Cookie
const verifyToken = (req, res, next) => {
  // Lấy token trực tiếp từ req.cookies (yêu cầu server đã dùng cookie-parser)
  const token = req.cookies?.token;

  if (!token) {
    console.log('Cookies:', req.cookies);
    console.log('Token from cookie or header:', token);
    return res.status(401).json({ 
      success: false, 
      message: 'Không tìm thấy Token trong Cookie, vui lòng đăng nhập lại!' 
    });
  }

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

// 2. Middleware kiểm tra quyền Admin
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