import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const navigate = useNavigate();

  // Đổi nhãn loại thiết bị sang tiếng Việt
  const getDeviceLabel = (type) => {
    switch (type) {
      case 'mobile': return '📱 Điện thoại';
      case 'laptop': return '💻 Laptop';
      case 'tablet': return '📲 Tablet';
      case 'mac': return '🖥️ Macbook/Mac';
      default: return '🔌 Thiết bị';
    }
  };

  const isAvailable = product.status === 'Còn hàng';

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: '1px solid #f0f0f0',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
    }}
    >
      <div>
        {/* Container hình ảnh & Huy hiệu */}
        <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#f8f9fa' }}>
          <img 
            src={product.img || 'https://via.placeholder.com/300x180?text=Chua+Co+Anh'} 
            alt={product.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => { e.target.src = 'https://via.placeholder.com/300x180?text=Loi+Anh'; }}
          />
          {/* Badge Trạng thái */}
          <span style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: isAvailable ? '#28a745' : '#6c757d',
            color: '#fff',
            fontSize: '11px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {product.status || 'Còn hàng'}
          </span>
          {/* Badge Loại thiết bị */}
          <span style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            color: '#fff',
            fontSize: '12px',
            padding: '3px 8px',
            borderRadius: '6px',
            backdropFilter: 'blur(4px)'
          }}>
            {getDeviceLabel(product.deviceType)}
          </span>
        </div>

        {/* Nội dung thông tin */}
        <div style={{ padding: '16px' }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '700', 
            color: '#212529', 
            margin: '0 0 8px 0',
            height: '42px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.3'
          }}>
            {product.name}
          </h3>

          <div style={{ 
            fontSize: '18px', 
            fontWeight: '800', 
            color: '#e63946', 
            marginBottom: '10px' 
          }}>
            {product.price ? product.price.toLocaleString('vi-VN') : 0} <span style={{ fontSize: '13px', fontWeight: 'normal' }}>VNĐ</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6c757d', marginBottom: '6px' }}>
            <span>📍</span>
            <span>Giao dịch tại: <strong>{product.local || 'Cơ sở 1'}</strong></span>
          </div>

          {product.description && (
            <p style={{ 
              fontSize: '12px', 
              color: '#888', 
              margin: '0', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              💬 {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Nút thao tác */}
      <div style={{ padding: '0 16px 16px 16px' }}>
        <button 
          onClick={() => navigate(`/edit/${product._id}`, { state: { product } })}
          style={{
            width: '100%',
            padding: '10px 0',
            backgroundColor: '#0066cc',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0052a3'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}
        >
          ✏️ Chỉnh sửa bài viết
        </button>
      </div>
    </div>
  );
}