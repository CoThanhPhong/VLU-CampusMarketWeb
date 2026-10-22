import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CreateProductPage() {
  const navigate = useNavigate();

  // Khởi tạo dữ liệu trống cho form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    amount: 1,
    local: 'Cơ sở 1',
    img: '',
    status: 'Còn hàng',
    deviceType: 'mobile'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Bắn API POST để tạo bài viết mới
    axios.post('http://localhost:5000/api/products/c', formData)
      .then((res) => {
        if (res.data.success) {
          alert('🎉 Đăng bài viết mới thành công!');
          navigate('/'); // Quay về trang chủ
        }
      })
      .catch((err) => {
        console.error(err);
        alert('❌ Lỗi khi đăng bài, vui lòng kiểm tra lại!');
      });
  };

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2 style={{ textAlign: 'center', color: '#1e293b' }}>📝 Đăng Bài Viết Mới</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        <label>Tên sản phẩm (VD: iPhone 13 Pro):</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ padding: '8px' }} />

        <label>Giá bán (VNĐ):</label>
        <input type="number" name="price" value={formData.price} onChange={handleChange} required style={{ padding: '8px' }} />

        <label>Loại thiết bị:</label>
        <select name="deviceType" value={formData.deviceType} onChange={handleChange} style={{ padding: '8px' }}>
          <option value="mobile">Điện thoại</option>
          <option value="tablet">Máy tính bảng</option>
          <option value="laptop">Laptop</option>
          <option value="mac">Macbook</option>
        </select>

        <label>Cơ sở giao dịch:</label>
        <select name="local" value={formData.local} onChange={handleChange} style={{ padding: '8px' }}>
          <option value="Cơ sở 1">Cơ sở 1</option>
          <option value="Cơ sở 2">Cơ sở 2</option>
          <option value="Cơ sở 3">Cơ sở 3</option>
        </select>

        <label>Link ảnh sản phẩm:</label>
        <input type="text" name="img" value={formData.img} onChange={handleChange} required placeholder="https://..." style={{ padding: '8px' }} />

        <label>Mô tả chi tiết (Tình trạng, cấu hình...):</label>
        <textarea name="description" rows="3" value={formData.description} onChange={handleChange} style={{ padding: '8px' }} />

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Đăng Bán Ngay
          </button>
          <button type="button" onClick={() => navigate('/')} style={{ flex: 1, padding: '10px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}