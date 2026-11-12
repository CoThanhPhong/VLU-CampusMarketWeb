import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Kiểm tra xem đã có user đăng nhập hay chưa (từ localStorage hoặc sessionStorage)
  const user =localStorage.getItem('user') || sessionStorage.getItem('user');

  // Nếu không có user, chuyển hướng về trang /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập, cho phép hiển thị nội dung bên trong
  return <Outlet />;
};

export default ProtectedRoute;