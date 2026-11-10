import React, { useState, useEffect } from "react";
import UserMenu from "../userMenu/UserMenu";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const Header = ({ isOpen, setIsOpen }) => {
  const [uniqueItemCount, setUniqueItemCount] = useState(0);
  const location = useLocation();

  const getUserFromStorage = () => {
    try {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  };

  const [currentUser, setCurrentUser] = useState(getUserFromStorage);
  const userAvatar = currentUser?.profile?.avatar || currentUser?.avatar || "";

  const fetchCartCount = async () => {
    try {
      const response = await axios.get("/api/cart/g", {
        withCredentials: true,
      });
      
      if (response.data.success) {
        const cartData = response.data.data || response.data.items || [];
        const items = Array.isArray(cartData) ? cartData : (cartData.items || []);
        const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setUniqueItemCount(totalQty);
        return;
      }
    } catch (error) {
      console.error("Lỗi lấy số lượng giỏ hàng cho header:", error);
    }

    try {
      const savedCart = sessionStorage.getItem("cartItems");
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        const totalQty = parsed.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setUniqueItemCount(totalQty);
      } else {
        setUniqueItemCount(0);
      }
    } catch (e) {
      setUniqueItemCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();

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

  const isCartActive = location.pathname === "/cart";

  return (
    <header className="header">
      <style>{`
        /* Ép buộc tất cả các nút icon trên header luôn giữ hiệu ứng nền khi hover, active hoặc đang được tương tác */
        .menu-btn:hover, .menu-btn.active,
        .icon-btn:hover, .icon-btn.active,
        .user-btn:hover, .user-btn:active,
        .cart-icon-btn:hover, .cart-icon-btn.active {
          background-color: rgba(0, 0, 0, 0.08) !important;
        }

        /* Vùng chứa UserMenu với kỹ thuật "Hover Bridge" chống mất bảng menu */
        .user-menu-container {
          position: relative;
          display: inline-block;
        }

        /* Tạo khoảng đệm vô hình (padding-top) để khi chuột di chuyển từ nút avatar vào menu không bị rớt */
        .user-dropdown-wrapper {
          display: none;
          position: absolute;
          right: 0;
          top: 100%;
          padding-top: 8px;
          z-index: 1000;
        }

        .user-menu-container:hover .user-dropdown-wrapper {
          display: block;
        }

        .user-dropdown-content {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
          min-width: 220px;
        }
      `}</style>

      <div className="header-left">
        <button
          className={`menu-btn ${isOpen ? "active" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Link className="logo" to="/">
          VLU Campus Market
        </Link>
      </div>

      <div className="header-right">
        {/* Nút giỏ hàng */}
        <Link
          to="/cart"
          className={`icon-btn cart-icon-btn ${isCartActive ? "active" : ""}`}
          style={{ position: "relative", display: "inline-flex", alignItems: "center", textDecoration: "none", color: "inherit", padding: "8px", borderRadius: "8px", transition: "background-color 0.2s" }}
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

        {/* Khu vực UserMenu dùng thẻ <button> chuẩn để nhận diện trọn vẹn hiệu ứng active/hover */}
        <div className="user-menu-container">
          <button
            type="button"
            className="icon-btn user-btn"
            style={{ 
              cursor: "pointer", 
              display: "flex", 
              alignItem: "center", 
              justifyContent: "center",
              padding: "6px", 
              borderRadius: "8px", 
              border: "none", 
              background: "transparent",
              transition: "background-color 0.2s" 
            }}
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

          <div className="user-dropdown-wrapper">
            <div className="user-dropdown-content">
              <UserMenu user={currentUser} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;