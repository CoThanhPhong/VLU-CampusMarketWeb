import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserMenu = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: 'Đang tải...',
    email: 'Đang tải...',
    avatar: ''
  });

  // Lấy thông tin user từ localStorage hoặc sessionStorage khi component mount
  useEffect(() => {
    try {
      // Ưu tiên lấy từ localStorage, nếu không có sẽ kiểm tra ở sessionStorage
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // Hỗ trợ linh hoạt các tên property khác nhau của object user
        setUserInfo({
          name: parsedUser.profile.name || 'Người dùng',
          email: parsedUser.email || '',
          avatar: parsedUser.profile.avatar || ''
        });
      }
    } catch (error) {
      console.error('Không thể đọc thông tin user từ storage:', error);
      setUserInfo({
        name: 'Người dùng',
        email: '',
        avatar: ''
      });
    }
  }, []);

  const logOut = async () => {
    try {
      // 1. Gọi API logout phía Backend để xóa Cookie (nếu có sử dụng cookie-parser)
      
      await axios.post('/api/auth/logout', {}, {});
    } catch (error) {
      console.error('Lỗi khi gọi API logout:', error);
    } finally {
      // 2. Xóa sạch thông tin lưu trữ ở trình duyệt dù gọi API thành công hay thất bại
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');

      // 3. Chuyển hướng về trang đăng nhập
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="user-dropdown">
      <div className="user-dropdown-header">
        {/* Hiển thị tên (có hỗ trợ chống tràn chữ) */}
        <p className="user-name" title={userInfo.name}>
          {userInfo.name}
        </p>
        
        {/* Hiển thị email (tự động cắt thành ... khi quá dài) */}
        <p className="user-email" title={userInfo.email}>
          {userInfo.email}
        </p>
      </div>

      <hr className="dropdown-divider" />

      <ul className="user-dropdown-list">
        <li className="user-dropdown-item" onClick={() => navigate('/profile')}>
          Hồ sơ cá nhân
        </li>
        <li className="user-dropdown-item" onClick={() => navigate('/settingProfile')}>
          Chỉnh sửa hồ sơ
        </li>
        <li className="user-dropdown-item text-danger" onClick={logOut}>
          Đăng xuất
        </li>
      </ul>
    </div>
  );
};

export default UserMenu;