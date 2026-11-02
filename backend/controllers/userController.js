const User = require('../models/User');
const UserDetail = require('../models/userDetail');

exports.getUserProfile = async (req, res) => {
  try {
    // req.user được giải mã từ middleware xác thực JWT token của bạn
    const userId = req.user.id; // Hoặc mssv tùy thuộc vào payload bạn ký trong token

    // Tìm user và populate sang bảng userDetail (profile)
    const user = await User.findById(userId).populate('profile');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
    }

    return res.status(200).json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile // Chứa các thông tin như mssv, phone, avatar, bio,...
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin profile:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server nội bộ!' });
  }
};