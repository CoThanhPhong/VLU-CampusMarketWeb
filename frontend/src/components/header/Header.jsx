import React, { useState, useRef, useEffect } from "react";
import UserMenu from "../userMenu/UserMenu";
import { Link } from "react-router-dom";
import axios from "axios";

const Header = ({ isOpen, setIsOpen }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [uniqueItemCount, setUniqueItemCount] = useState(0);
  const userMenuRef = useRef(null);

  // Hàm đọc dữ liệu user an toàn
  const getUserFromStorage = () => {
    try {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  };

  // State lưu trữ user ở Header
  const [currentUser, setCurrentUser] = useState(getUserFromStorage);
  
  // Lấy avatar linh hoạt cả từ profile.avatar hoặc avatar gốc
  const userAvatar = currentUser?.profile?.avatar || currentUser?.avatar || "";

  const fetchCartCount = async () => {
    try {
      const response = await axios.get("/api/cart/g", { withCredentials: true });
      if (response.data.success && Array.isArray(response.data.data)) {
        setUniqueItemCount(response.data.data.length);
      }
    } catch (error) {
      try {
        const savedCart = sessionStorage.getItem("cartItems");
        setUniqueItemCount(savedCart ? JSON.parse(savedCart).length : 0);
      } catch (e) {
        setUniqueItemCount(0);
      }
    }
  };

  useEffect(() => {
    fetchCartCount();

    // Cập nhật state ngay khi có sự kiện userUpdated
    const handleUserUpdated = () => {
      setCurrentUser(getUserFromStorage());
    };

    const handleCartUpdated = () => {
      fetchCartCount();
    };

    window.addEventListener("userUpdated", handleUserUpdated);
    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("storage", handleUserUpdated);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("storage", handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <button
          className={`menu-btn ${isOpen ? "active" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link className="logo" to="/">
          VLU Campus Market
        </Link>
      </div>

      <div className="header-right">
        <Link
          to="/cart"
          className="icon-btn"
          style={{ position: "relative", display: "inline-flex", alignItems: "center", textDecoration: "none", color: "inherit" }}
          title="Giỏ hàng"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
            />
          </svg>
          {uniqueItemCount > 0 && (
            <span
              className="badge"
              style={{
                position: "absolute", top: "2px", right: "2px", backgroundColor: "#e74c3c", color: "#fff",
                fontSize: "9px", fontWeight: "bold", minWidth: "15px", height: "15px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #fff"
              }}
            >
              {uniqueItemCount}
            </span>
          )}
        </Link>

        <div className="user-menu-container" ref={userMenuRef}>
          <button
            className={`icon-btn user-btn ${showUserMenu ? "active" : ""}`}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="User Avatar"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block"
                }}
              />
            ) : (
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </button>

          <div className={`user-dropdown-wrapper ${showUserMenu ? "active" : ""}`}>
            {/* Truyền user mới xuống UserMenu để đồng bộ thông tin trong menu thả xuống */}
            <UserMenu user={currentUser} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
