const User = require('../models/User');
const UserDetail = require('../models/userDetail');
const mongoose = require('mongoose');

// 1. Lấy thông tin của chính user đang đăng nhập (dựa vào token)
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; 

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
        profile: user.profile 
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
    if (!req.body || !req.body.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp id trong request body!' 
      });
    }

    const { id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID người dùng không hợp lệ!' 
      });
    }

    const user = await User.findById(id).select('-password').populate('profile');

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

// 4. Cập nhật thông tin profile của chính user đang đăng nhập
const updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, bio, avatar, cart, products } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (cart !== undefined) updateData.cart = cart;
    if (products !== undefined) updateData.products = products;

    let updatedProfile;
    if (user.profile) {
      updatedProfile = await UserDetail.findByIdAndUpdate(
        user.profile,
        { $set: updateData },
        { returnDocument: true, runValidators: true }
      );
    } else {
      updatedProfile = await UserDetail.create(updateData);
      user.profile = updatedProfile._id;
    }

    user.profile = updatedProfile;
    const userObject = user.toObject();
    delete userObject.password;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ thành công!',
      data: {
        user: userObject
      }
    });

  } catch (error) {
    console.error('Lỗi cập nhật thông tin user:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server nội bộ!' });
  }
};

// 5. Cập nhật quyền hạn (Role) của người dùng (Dành cho Admin)
const updateUserRole = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền thực hiện thao tác này!' 
      });
    }

    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp đầy đủ userId và newRole!' 
      });
    }

    if (!['user', 'admin'].includes(newRole)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role không hợp lệ (chỉ nhận user hoặc admin)!' 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { returnDocument: 'after', runValidators: true }
    ).populate('profile');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng cần phân quyền!' });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật quyền hạn thành công!',
      data: updatedUser
    });
  } catch (error) {
    console.error('Lỗi cập nhật role:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server nội bộ!' });
  }
};

// 6. Xóa tài khoản người dùng theo ID (Dành cho Admin)
const deleteUser = async (req, res) => {
  try {
    // Nếu route đã có middleware kiểm tra admin thì req.user đã có sẵn
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền thực hiện thao tác này!' 
      });
    }

    // Nhận userId từ body.userId hoặc body._id
    const userId = req.body.userId || req.body._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ!' });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản để xóa!' });
    }

    if (deletedUser.profile) {
      await UserDetail.findByIdAndDelete(deletedUser.profile);
    }

    return res.status(200).json({
      success: true,
      message: 'Đã xóa tài khoản thành công!'
    });
  } catch (error) {
    console.error('Lỗi xóa user:', error.message);
    return res.status(500).json({ success: false, message: 'Lỗi server nội bộ!' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateCurrentUser,
  updateUserRole,
  deleteUser
};