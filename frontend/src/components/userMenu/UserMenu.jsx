import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserMenu = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: 'Đang tải...',
    email: 'Đang tải...',
    avatar: '',
    id: ''
  });

  // Lấy thông tin user từ localStorage hoặc sessionStorage khi component mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // Lấy ID linh hoạt dựa trên cấu trúc dữ liệu trả về từ backend
        const userId = parsedUser._id || parsedUser.id || parsedUser.profile?.id || parsedUser.profile?._id;

        setUserInfo({
          id: userId || '',
          name: parsedUser.profile?.name || parsedUser.name || 'Người dùng',
          email: parsedUser.email || '',
          avatar: parsedUser.profile?.avatar || parsedUser.avatar || ''
        });
      }
    } catch (error) {
      console.error('Không thể đọc thông tin user từ storage:', error);
      setUserInfo({
        name: 'Người dùng',
        email: '',
        avatar: '',
        id: ''
      });
    }
  }, []);

  const logOut = async () => {
    try {
      await axios.post('/api/auth/logout', {}, {});
    } catch (error) {
      console.error('Lỗi khi gọi API logout:', error);
    } finally {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="user-dropdown">
      <div className="user-dropdown-header">
        <p className="user-name" title={userInfo.name}>
          {userInfo.name}
        </p>
        <p className="user-email" title={userInfo.email}>
          {userInfo.email}
        </p>
      </div>

      <hr className="dropdown-divider" />

      <ul className="user-dropdown-list">
        {/* Đã sửa lại để lấy đúng ID và chuyển hướng chính xác đến trang UserDetail */}
        <li 
          className="user-dropdown-item" 
          onClick={() => {
            if (userInfo.id) {
              navigate(`/user/${userInfo.id}`);
            } else {
              console.warn("Không tìm thấy ID người dùng!");
            }
          }}
        >
          Hồ sơ cá nhân
        </li>
        <li 
          className="user-dropdown-item" 
          onClick={() => {
            navigate(`/orders`);
          }}
        >
          Lịch sử đơn hàng
        </li>
        
        {/* Đã loại bỏ mục "Chỉnh sửa hồ sơ" theo yêu cầu */}

        <li className="user-dropdown-item text-danger" onClick={logOut}>
          Đăng xuất
        </li>
      </ul>
    </div>
  );
};

export default UserMenu;