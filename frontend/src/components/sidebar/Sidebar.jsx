import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import axios from 'axios';
import '../../css/Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const userRole = parsedUser.role || parsedUser.profile?.role;
        setIsAdmin(userRole === 'admin' || parsedUser.isAdmin === true);
      }
    } catch (err) {
      console.error("Lỗi kiểm tra quyền admin:", err);
    }
  }, []);

  // Tự động đồng bộ số lượng đơn hàng cần xác nhận từ DB mỗi 5 giây
  useEffect(() => {
    const fetchPendingOrdersCount = async () => {
      try {
        const res = await axios.get('/api/orders/seller/g', { withCredentials: true });
        if (res.data.success) {
          const count = res.data.data.filter(ord => !ord.isPaid && ord.orderStatus !== 'Đã hủy').length;
          setPendingCount(count);
        }
      } catch (err) {
        // Bỏ qua lỗi ngầm khi chưa phân quyền seller
      }
    };

    fetchPendingOrdersCount();
    const interval = setInterval(fetchPendingOrdersCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const isHomeActive = location.pathname === "/home";

  return (
    <nav className={`sidebar ${isOpen ? "open" : "closed"}`}>
      {isAdmin && (
        <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <div className="nav-icon-wrapper">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="nav-text">Trang Admin</span>
        </NavLink>
      )}

      <NavLink to="/home" end className={() => `nav-item ${isHomeActive ? "active" : ""}`}>
        <div className="nav-icon-wrapper">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <span className="nav-text">Trang chủ</span>
      </NavLink>

      <NavLink to="/create-post" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <div className="nav-icon-wrapper">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <span className="nav-text">Tạo bài viết</span>
      </NavLink>

      <NavLink to="/seller" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
        <div className="nav-icon-wrapper">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {pendingCount > 0 && <span className="sidebar-badge">{pendingCount}</span>}
        </div>
        <span className="nav-text">Quản lý bán hàng</span>
        {pendingCount > 0 && <span className="sidebar-badge-inline">{pendingCount}</span>}
      </NavLink>
    </nav>
  );
};

export default Sidebar;