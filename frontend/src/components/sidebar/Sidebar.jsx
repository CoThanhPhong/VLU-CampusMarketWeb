import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  // Kiểm tra nếu đường dẫn hiện tại là "/" hoặc "/home" thì active Trang chủ
  const isHomeActive = location.pathname === "/" || location.pathname === "/home";

  return (
    <nav className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <NavLink
        to="/"
        end
        className={() => `nav-item ${isHomeActive ? "active" : ""}`}
      >
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <span>Trang chủ</span>
      </NavLink>

      <NavLink
        to="/create-post"
        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      >
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        <span>Tạo bài viết</span>
      </NavLink>

    </nav>
  );
};

export default Sidebar;