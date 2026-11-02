const jwt = require('jsonwebtoken');

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
    // Giải mã token bằng secret key (phải trùng với lúc bạn tạo token ở hàm login)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'VLU_SECRET_KEY');
    
    // Gán thông tin đã giải mã (ví dụ: id hoặc mssv) vào req.user để controller sử dụng
    req.user = decoded; 
    
    next(); // Cho phép đi tiếp vào Controller
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token không hợp lệ hoặc đã hết hạn!' 
    });
  }
};

module.exports = verifyToken;