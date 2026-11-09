import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    amount: 1, // Bắt buộc theo Schema
    local: 'Cơ sở 1',
    img: '',
    status: 'Còn hàng', // Chỉ được dùng 'Còn hàng' hoặc 'Hết hàng'
    deviceType: 'mobile',
    author: '', // Bắt buộc theo Schema, sẽ được Backend tự động gán từ user hiện tại
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate: Tuyệt đối không cho phép giá âm
    if (Number(formData.price) < 0) {
      alert('Giá bán không được để số âm!');
      return;
    }
    if (Number(formData.amount) < 1) {
      alert('Số lượng phải từ 1 trở lên!');
      return;
    }

    setIsLoading(true);

    // Tự động đóng gói thêm startDate (Ngày tạo) để đáp ứng yêu cầu required: true của Backend
    const dataToSend = {
      ...formData,
      startDate: new Date().toISOString()
    };
    
    // Gọi API: Đã bỏ tiền tố http://localhost:5000
    axios.post('/api/products/c', dataToSend)
      .then((res) => {
        if (res.data.success) {
          alert('Đăng bài viết mới thành công!');
          navigate('/home'); 
        } else {
          alert('Không thể đăng bài: ' + res.data.message);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi gọi API Đăng bài:', err);
        alert('Lưu thất bại! Bạn hãy F12 -> Network để xem chi tiết nhé.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '20px', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        Đăng Tin Bán Thiết Bị
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Tên thiết bị</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Giá bán (VNĐ)</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Loại thiết bị</label>
            <select name="deviceType" value={formData.deviceType} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}>
              <option value="mobile">Điện thoại</option>
              <option value="tablet">Máy tính bảng</option>
              <option value="laptop">Laptop</option>
              <option value="mac">Macbook</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Cơ sở giao dịch</label>
            <select name="local" value={formData.local} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}>
              <option value="Cơ sở 1">Cơ sở 1</option>
              <option value="Cơ sở 2">Cơ sở 2</option>
              <option value="Cơ sở 3">Cơ sở 3</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Tình trạng</label>
            <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}>
              <option value="Còn hàng">Còn hàng</option>
              <option value="Hết hàng">Hết hàng</option> {/* Sửa lại cho khớp Backend */}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Đường dẫn Ảnh (Link URL)</label>
            <input type="url" name="img" value={formData.img} onChange={handleChange} required placeholder="https://..." style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Số lượng</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="1" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Mô tả chi tiết</label>
          <textarea name="description" rows="4" value={formData.description} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="submit" disabled={isLoading} style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
            {isLoading ? 'Đang xử lý...' : 'Xác nhận Đăng tin'}
          </button>
          <button type="button" onClick={() => navigate('/home')} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  );
}