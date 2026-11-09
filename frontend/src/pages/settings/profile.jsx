import React, { useState } from 'react';
import axios from 'axios';

// Bật cấu hình để axios tự động gửi cookie đi kèm trong mọi request
axios.defaults.withCredentials = true;

const SettingProfile = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State quản lý lỗi tải ảnh để tự chuyển về ảnh mặc định khi link hỏng
  const [imgError, setImgError] = useState(false);

  // Lấy dữ liệu user thực tế từ sessionStorage hoặc localStorage
  const getInitialUser = () => {
    try {
      const authData = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (authData) {
        return JSON.parse(authData);
      }
    } catch (e) {
      console.error("Lỗi đọc dữ liệu lưu trữ:", e);
    }
    return {};
  };

  const currentUser = getInitialUser();

  const [formData, setFormData] = useState({
    mssv: currentUser.mssv || '',
    email: currentUser.email || '',
    profile: {
      name: currentUser.profile?.name || '',
      phone: currentUser.profile?.phone || '',
      bio: currentUser.profile?.bio || '',
      avatar: currentUser.profile?.avatar || ''
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Các trường nằm bên trong object profile
    if (['name', 'phone', 'bio', 'avatar'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Reset trạng thái lỗi ảnh khi người dùng nhập link avatar mới
    if (name === 'avatar') {
      setImgError(false);
    }
  };

 const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    axios.post('/api/auth/user/u', formData.profile)
      .then((response) => {
        const resData = response.data;

        if (resData.success) {
          setMessage({ type: 'success', text: '🎉 ' + (resData.message || 'Cập nhật hồ sơ thành công!') });
          
          // 1. Tạo object user mới chuẩn hóa dữ liệu
          const updatedUser = {
            ...currentUser,
            profile: {
              ...(currentUser.profile || {}),
              ...formData.profile
            }
          };
          
          const userStr = JSON.stringify(updatedUser);
          if (localStorage.getItem('user')) localStorage.setItem('user', userStr);
          if (sessionStorage.getItem('user')) sessionStorage.setItem('user', userStr);
          
          // Nút fallback nếu cả 2 chưa có
          if (!localStorage.getItem('user') && !sessionStorage.getItem('user')) {
            sessionStorage.setItem('user', userStr);
          }

          // 3. Phát sự kiện toàn hệ thống
          window.dispatchEvent(new Event('userUpdated'));

        } else {
          setMessage({ type: 'error', text: '⚠️ ' + (resData.message || 'Cập nhật thất bại!') });
        }
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || err.message || 'Lỗi kết nối đến server!';
        setMessage({ type: 'error', text: `❌ ${errorMsg}` });
      })
      .finally(() => setLoading(false));
  };

  // Ảnh dự phòng khi ô input avatar trống hoặc link ảnh ngoài bị lỗi/chặn CORS
  const fallbackAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.profile.name || 'User') + '&background=0D8ABC&color=fff&size=100';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
      
      <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)' }}>
        
        {/* Tiêu đề */}
        <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', backgroundColor: '#eff6ff', borderRadius: '10px', color: '#3b82f6' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>Hồ sơ cá nhân</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Quản lý thông tin hiển thị và phương thức liên hệ của bạn.</p>
          </div>
        </div>

        {/* Thông báo trạng thái */}
        {message.text && (
          <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '15px', fontWeight: '500', backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2', color: message.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Avatar Section với tính năng Preview trực tiếp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={!imgError && formData.profile.avatar ? formData.profile.avatar : fallbackAvatar} 
                alt="Avatar Preview" 
                onError={() => setImgError(true)}
                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', backgroundColor: '#f1f5f9' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Đường dẫn Ảnh đại diện</label>
              <input 
                type="url" 
                name="avatar" 
                value={formData.profile.avatar} 
                onChange={handleChange} 
                placeholder="Dán đường dẫn ảnh trực tiếp vào đây (https://...)" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} 
              />
            </div>
          </div>

          {/* Dòng 1: Tên & MSSV */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Họ và tên</label>
              <input type="text" name="name" value={formData.profile.name} onChange={handleChange} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                Mã số sinh viên <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'normal' }}>Không thể sửa</span>
              </label>
              <input type="text" name="mssv" value={formData.mssv} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8', fontSize: '15px', cursor: 'not-allowed', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Dòng 2: SĐT & Email */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Số điện thoại</label>
              <input type="text" name="phone" value={formData.profile.phone} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: '1 1 300px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                Email <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'normal' }}>Không thể sửa</span>
              </label>
              <input type="email" name="email" value={formData.email} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8', fontSize: '15px', cursor: 'not-allowed', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Dòng 3: Bio */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Giới thiệu bản thân</label>
            <textarea name="bio" rows="4" value={formData.profile.bio} onChange={handleChange} placeholder="Viết một vài dòng giới thiệu về bạn..." style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>

          {/* Nút Submit */}
          <div style={{ marginTop: '8px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={loading} style={{ padding: '14px 32px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'background 0.2s' }}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default SettingProfile;