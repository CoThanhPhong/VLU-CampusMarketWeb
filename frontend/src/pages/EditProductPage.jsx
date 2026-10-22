import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EditProductPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product || {};

  const [formData, setFormData] = useState({
    _id: product._id || '',
    name: product.name || '',
    description: product.description || '',
    price: product.price || 0,
    amount: product.amount || 1,
    local: product.local || 'Cơ sở 1',
    img: product.img || '',
    status: product.status || 'Còn hàng',
    deviceType: product.deviceType || 'mobile'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.put('http://localhost:5000/api/products/u', formData)
      .then((res) => {
        if (res.data.success) {
          alert('✅ Cập nhật bài viết thành công!');
          navigate('/');
        }
      })
      .catch((err) => {
        console.error(err);
        alert('❌ Cập nhật thất bại, kiểm tra lại dữ liệu!');
      });
  };

  return (
    <div style={{ maxWidth: '500px', margin: '30px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Chỉnh Sửa Bài Đăng</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label>Tên sản phẩm:</label>
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

        <label>Trạng thái:</label>
        <select name="status" value={formData.status} onChange={handleChange} style={{ padding: '8px' }}>
          <option value="Còn hàng">Còn hàng</option>
          <option value="Hết hàng">Hết hàng</option>
        </select>

        <label>Link ảnh sản phẩm:</label>
        <input type="text" name="img" value={formData.img} onChange={handleChange} style={{ padding: '8px' }} />

        <label>Mô tả chi tiết:</label>
        <textarea name="description" rows="3" value={formData.description} onChange={handleChange} style={{ padding: '8px' }} />

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu thay đổi</button>
          <button type="button" onClick={() => navigate('/')} style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
        </div>
      </form>
    </div>
  );
}