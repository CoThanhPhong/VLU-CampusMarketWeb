import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const [qty, setQty] = useState(1); // State quản lý số lượng mua
  
  const isAvailable = product?.status === 'Còn hàng' && product?.amount > 0;
  
  // Mapping tên loại thiết bị sang tiếng Việt
  const deviceLabels = { 
    mobile: 'Điện thoại', 
    tablet: 'Máy tính bảng', 
    laptop: 'Laptop', 
    mac: 'Macbook' 
  };
  
  // Xử lý thông tin tác giả
  const authorId = product?.author?._id || product?.author || '#';
  const authorName = product?.author?.name || 'Thành viên VLU';

  // Hàm xử lý tăng giảm số lượng (không vượt quá số lượng trong kho)
  const handleDecrease = (e) => { 
    e.stopPropagation(); 
    setQty(p => p > 1 ? p - 1 : 1); 
  };
  const handleIncrease = (e) => { 
    e.stopPropagation(); 
    setQty(p => p < product.amount ? p + 1 : product.amount); 
  };

  // Hàm xử lý nút Mua hàng
  const handleBuyNow = (e) => { 
    e.stopPropagation(); 
    alert(`Đã tiến hành thanh toán ${qty} sản phẩm.`);
  };
  
  const handleAddToCart = (e) => { 
    e.stopPropagation(); 
    alert(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`); 
  };

  return (
    <div 
      onClick={() => navigate(`/product/${product?._id}`)}
      style={{
        backgroundColor: '#ffffff', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease', 
        cursor: 'pointer', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div>
        {/* HÌNH ẢNH SẢN PHẨM VÀ CÁC NHÃN */}
        <div style={{ position: 'relative', width: '100%', height: '170px', backgroundColor: '#f1f5f9' }}>
          <img 
            src={product?.img || 'https://via.placeholder.com/300x170?text=No+Image'} 
            alt={product?.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x170?text=Lỗi+Ảnh'; }}
          />
          
          {/* Nhãn Loại thiết bị */}
          <span style={{ 
            position: 'absolute', top: '8px', left: '8px', 
            backgroundColor: '#334155', color: '#ffffff', 
            fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '4px' 
          }}>
            {deviceLabels[product?.deviceType] || product?.deviceType || 'Sản phẩm'}
          </span>

          {/* Nhãn Trạng thái */}
          <span style={{
            position: 'absolute', top: '8px', right: '8px',
            backgroundColor: isAvailable ? '#16a34a' : '#64748b',
            color: '#ffffff', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '4px'
          }}>
            {product?.status || 'Còn hàng'}
          </span>
        </div>

        {/* THÔNG TIN CHI TIẾT SẢN PHẨM */}
        <div style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: '0 0 6px 0', height: '40px', overflow: 'hidden' }}>
            {product?.name}
          </h3>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>
            {product?.price ? product.price.toLocaleString('vi-VN') : 0} <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>VNĐ</span>
          </div>
          
        {/* Thông tin Người đăng */}
        <div 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (authorId === '#') {
              alert('Bài viết cũ này chưa được cập nhật dữ liệu người đăng!');
            } else {
              navigate(`/user/${authorId}`); 
            }
          }}
          style={{ fontSize: '13px', color: '#2563eb', cursor: 'pointer', marginTop: '6px', marginBottom: '12px' }}
        >
          Người đăng: <b>{authorName}</b>
        </div>

          {/* Hàng hiển thị Vị trí và Ngày đăng (Giữ nguyên từ bản cũ) */}
          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{product?.local || 'Cơ sở 1'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{product?.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}</span>
            </div>
          </div>

          {/* Bộ chọn số lượng mua (UI Mới) */}
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc' }}>
              <button onClick={handleDecrease} style={{ padding: '4px 10px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>-</button>
              <span style={{ fontSize: '13px', padding: '0 8px', fontWeight: '600' }}>{qty}</span>
              <button onClick={handleIncrease} style={{ padding: '4px 10px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>+</button>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>(Sẵn có: {product?.amount || 0})</span>
          </div>
        </div>
      </div>

      {/* CÁC NÚT HÀNH ĐỘNG: MUA NGAY VÀ THÊM GIỎ HÀNG */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 12px 12px 12px' }}>
        <button 
          onClick={handleBuyNow}
          disabled={!isAvailable}
          style={{ flex: 1, padding: '8px 0', backgroundColor: isAvailable ? '#dc2626' : '#94a3b8', color: '#ffffff', border: 'none', borderRadius: '4px', fontWeight: '600', fontSize: '12px', cursor: isAvailable ? 'pointer' : 'not-allowed' }}
        >
          Mua ngay
        </button>
        <button 
          onClick={handleAddToCart}
          disabled={!isAvailable}
          style={{ flex: 1, padding: '8px 0', backgroundColor: isAvailable ? '#10b981' : '#f1f5f9', color: isAvailable ? '#ffffff' : '#94a3b8', border: 'none', borderRadius: '4px', fontWeight: '600', fontSize: '12px', cursor: isAvailable ? 'pointer' : 'not-allowed' }}
        >
          Thêm giỏ hàng
        </button>
      </div>
    </div>
  );
}