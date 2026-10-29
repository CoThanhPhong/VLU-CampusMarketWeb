import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const isAvailable = product?.status === 'Còn hàng';

  // Xử lý nút Liên hệ -> Chuyển sang gửi Mail
  const handleContact = (e) => {
    e.stopPropagation(); // Ngăn sự kiện click vào thẻ
    const email = product?.sellerEmail || 'admin@vlu.edu.vn';
    window.location.href = `mailto:${email}?subject=Hỏi mua sản phẩm: ${product?.name || ''}`;
  };

  return (
    <div 
      // Chuyển hướng sang trang chi tiết khi click vào thẻ
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
        <div style={{ position: 'relative', width: '100%', height: '170px', backgroundColor: '#f1f5f9' }}>
          <img 
            src={product?.img || 'https://via.placeholder.com/300x170?text=No+Image'} 
            alt={product?.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x170?text=Lỗi+Ảnh'; }}
          />
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: isAvailable ? '#16a34a' : '#64748b',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            {product?.status || 'Còn hàng'}
          </span>
        </div>

        <div style={{ padding: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: '0 0 6px 0', height: '40px', overflow: 'hidden' }}>
            {product?.name}
          </h3>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>
            {product?.price ? product.price.toLocaleString('vi-VN') : 0} <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>VNĐ</span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* SVG Icon Vị trí thay cho Emoji */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{product?.local || 'Cơ sở 1'}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px 12px 12px' }}>
        <button 
          onClick={handleContact}
          style={{
            width: '100%',
            padding: '8px 0',
            backgroundColor: '#0ea5e9',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {/* SVG Icon Mail thay cho Emoji */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          Liên hệ người bán
        </button>
      </div>
    </div>
  );
}