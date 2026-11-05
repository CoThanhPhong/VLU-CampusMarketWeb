import React, { useState, useRef, useEffect } from 'react';
import UserMenu from '../userMenu/UserMenu';
import { Link } from 'react-router-dom';

const Header = ({ isOpen, setIsOpen }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [uniqueItemCount, setUniqueItemCount] = useState(0);
  const userMenuRef = useRef(null);

  // Lấy trực tiếp user mới nhất từ localStorage mỗi khi component render
  const getUserFromStorage = () => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')) : null;
    } catch (e) {
      return null;
    }
  };

  const user = getUserFromStorage();
  const userAvatar = user?.profile?.avatar || "";

  // Cập nhật số lượng loại sản phẩm độc lập trong giỏ hàng
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const savedCart = sessionStorage.getItem('cartItems');
        if (savedCart) {
          const items = JSON.parse(savedCart);
          // Đếm số lượng loại sản phẩm khác nhau (độ dài mảng)
          setUniqueItemCount(items.length);
        } else {
          setUniqueItemCount(0);
        }
      } catch (e) {
        setUniqueItemCount(0);
      }
    };

    updateCartCount();

    // Lắng nghe sự kiện thay đổi giỏ hàng
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <button className={`menu-btn ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link className="logo" to='/'>VLU Campus Market</Link>
      </div>

      <div className="header-right">
        {/* Thay thế nút chuông thông báo bằng Link đến trang giỏ hàng */}
        <Link to="/cart" className="icon-btn" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }} title="Giỏ hàng">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {uniqueItemCount > 0 && (
            <span className="badge" style={{
              position: 'absolute',
              top: '-5px',
              right: '-8px',
              backgroundColor: '#e74c3c',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '1px 5px',
              borderRadius: '50%',
              minWidth: '16px',
              textAlign: 'center',
              lineHeight: '16px'
            }}>
              {uniqueItemCount}
            </span>
          )}
        </Link>
        
        <div className="user-menu-container" ref={userMenuRef}>
          <button 
            className={`icon-btn user-btn ${showUserMenu ? 'active' : ''}`}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {userAvatar !== "" ? (
              <img 
                src={userAvatar} 
                alt="User Avatar" 
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} 
              />
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </button>

          <div className={`user-dropdown-wrapper ${showUserMenu ? 'active' : ''}`}>
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;