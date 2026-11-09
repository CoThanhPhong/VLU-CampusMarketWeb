const User = require('../models/User');
const UserDetail = require('../models/userDetail');
const mongoose = require('mongoose');

// 1. Lấy thông tin của chính user đang đăng nhập (dựa vào token)
const getCurrentUser = async (req, res) => {
  try {
    // req.user được giải mã từ middleware xác thực JWT token
    const userId = req.user.id; // Hoặc req.user._id tùy vào lúc bạn sign token

    // Tìm user và populate sang bảng userDetail (profile)
    const user = await User.findById(userId).populate('profile');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        mssv: user.mssv,
        email: user.email,
        role: user.role,
        profile: user.profile // Chứa thông tin chi tiết (mssv, phone, avatar,...)
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin profile:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server nội bộ!' });
  }
};

// 2. Lấy danh sách TẤT CẢ người dùng (Dành cho Admin)
const getAllUsers = async (req, res) => {
  try {
    // Kiểm tra xem request đã qua verifyToken chưa và role có phải admin không
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền truy cập (Yêu cầu tài khoản Admin)!' 
      });
    }

    const users = await User.find().populate('profile');
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Lỗi lấy danh sách user:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server nội bộ!' });
  }
};

// 3. Lấy thông tin chi tiết một user theo ID trên Database
const getUserById = async (req, res) => {
  try {
    // 1. kiểm tra có req.body và req.body.id hay không
    if (!req.body || !req.body.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp id trong request body!' 
      });
    }

    // Lấy id từ req.body do client gửi lên
    const { id } = req.body;

    // 2. Kiểm tra xem id có đúng chuẩn ObjectId của MongoDB hay không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID người dùng không hợp lệ!' 
      });
    }

    // 3. Tìm user theo ID trong MongoDB và populate profile
    const user = await User.findById(id).populate('profile');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng!' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: user 
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin user theo ID:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi server nội bộ!' 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getCurrentUser
};