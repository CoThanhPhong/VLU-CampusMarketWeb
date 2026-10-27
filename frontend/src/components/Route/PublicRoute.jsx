import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  // Kiểm tra xem đã có token đăng nhập hay chưa
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // Nếu đã đăng nhập rồi mà vào trang login -> chuyển hướng thẳng về trang chủ (/)
  if (token) {
    return <Navigate to="/" replace />;
  }

  // Nếu chưa đăng nhập -> cho phép xem trang login
  return <Outlet />;
};

export default PublicRoute;