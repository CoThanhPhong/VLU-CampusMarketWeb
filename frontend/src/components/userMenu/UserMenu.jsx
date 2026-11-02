import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Hoặc dùng axios client đã cấu hình sẵn của bạn

const UserMenu = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: 'Đang tải...',
    email: 'Đang tải...',
    avatar: ''
  });

  // Gọi API lấy thông tin user khi component được render
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          const { name, email, profile } = response.data.data;
          setUserInfo({
            name: name || profile?.name || 'Người dùng',
            email: email || profile?.email || '',
            avatar: profile?.avatar || ''
          });
        }
      } catch (error) {
        console.error('Không thể lấy thông tin profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  const logOut = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="user-dropdown">
      <div className="user-dropdown-header">
        {/* Hiển thị tên và email động từ API */}
        <p className="user-name">{userInfo.name}</p>
        <p className="user-email">{userInfo.email}</p>
      </div>
      <hr className="dropdown-divider" />
      <ul className="user-dropdown-list">
        <li className="user-dropdown-item" onClick={() => navigate('/profile')}>
          Hồ sơ cá nhân
        </li>
        <li className="user-dropdown-item" onClick={() => navigate('/settingProfile')}>
          Cài đặt hồ sơ
        </li>
        <li className="user-dropdown-item text-danger" onClick={logOut}>
          Đăng xuất
        </li>
      </ul>
    </div>
  );
};

export default UserMenu;