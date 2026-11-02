import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Login.css';

const Login = () => {
  const [mssv, setMssv] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Gọi API đăng nhập tới Backend (giả sử port backend là 5000 hoặc dùng Vite Proxy)
      const response = await fetch('api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mssv, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Lưu token vào localStorage (hoặc sessionStorage nếu "Ghi nhớ đăng nhập" không được chọn)
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      // Chuyển hướng về trang chủ sau khi đăng nhập thành công
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img src="https://online.vlu.edu.vn/Content/logo/logosona.jpg"/>
        </div>

        {/* Tiêu đề */}
        <h2 className="login-title">Đăng nhập</h2>

        {/* Hiển thị lỗi nếu có */}
        {error && <div className="login-error">{error}</div>}

        {/* Form đăng nhập */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input 
              type="text" 
              placeholder="MSSV" 
              value={mssv}
              onChange={(e) => setMssv(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              placeholder="Mật khẩu trang online.vlu" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div className="form-actions">
            <label className="remember-me">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;