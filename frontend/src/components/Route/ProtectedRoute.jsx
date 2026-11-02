import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Kiểm tra xem đã có token đăng nhập hay chưa (từ localStorage hoặc sessionStorage)
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // Nếu không có token, chuyển hướng về trang /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập, cho phép hiển thị nội dung bên trong
  return <Outlet />;
};

export default ProtectedRoute;