import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const [qty, setQty] = useState(1); // State quản lý số lượng mua
  
  // State lưu thông tin tên và id của tác giả
  const [authorName, setAuthorName] = useState('Đang tải...');
  const [authorId, setAuthorId] = useState('#');

  const isAvailable = product?.status === 'Còn hàng' && product?.amount > 0;
  
  // Mapping tên loại thiết bị sang tiếng Việt
  const deviceLabels = { 
    mobile: 'Điện thoại', 
    tablet: 'Máy tính bảng', 
    laptop: 'Laptop', 
    mac: 'Macbook' 
  };

  // Lấy thông tin tác giả dựa vào product.author (có thể là string id hoặc object)
  useEffect(() => {
    let alive = true;

    const resolveAuthor = async () => {
      const rawAuthor = product?.author;
      
      if (!rawAuthor) {
        if (alive) {
          setAuthorName('Thành viên VLU');
          setAuthorId('#');
        }
        return;
      }

      // Trường hợp author đã là một object đầy đủ thông tin { _id, profile: { name } }
      if (typeof rawAuthor === 'object' && rawAuthor !== null) {
        const id = rawAuthor._id || rawAuthor.id || '#';
        const name = rawAuthor.profile?.name || rawAuthor.name || 'Thành viên VLU';
        if (alive) {
          setAuthorId(id);
          setAuthorName(name);
        }
        return;
      }

      // Trường hợp author chỉ là một chuỗi ID (ví dụ: "6aecaa1bd8283c08d80d08b1")
      const idStr = String(rawAuthor);
      if (alive) setAuthorId(idStr);

      try {
        const response = await axios.post('/api/auth/user', { id: idStr });
        const resData = response.data;
        const userData = resData?.data || resData?.user || resData;
        const name = userData?.profile?.name || userData?.name;

        if (name && alive) {
          setAuthorName(name);
        } else if (alive) {
          setAuthorName('Thành viên VLU');
        }
      } catch (error) {
        console.error('Lỗi lấy thông tin tác giả:', error);
        if (alive) {
          setAuthorName('Thành viên VLU');
        }
      }
    };

    resolveAuthor();

    return () => {
      alive = false;
    };
  }, [product?.author]);

  // Hàm xử lý tăng giảm số lượng (không vượt quá số lượng trong kho)
  const handleDecrease = (e) => { 
    e.stopPropagation(); 
    setQty(p => p > 1 ? p - 1 : 1); 
  };
  const handleIncrease = (e) => { 
    e.stopPropagation(); 
    setQty(p => p < product.amount ? p + 1 : product.amount); 
  };

  // 1. Hàm xử lý nút "Thêm giỏ hàng" (Gọi API /api/cart/u)
  const handleAddToCart = async (e) => { 
    e.stopPropagation(); 
    if (!isAvailable) return;

    try {
      let currentCart = [];
      try {
        const savedCart = sessionStorage.getItem('cartItems');
        if (savedCart) currentCart = JSON.parse(savedCart);
      } catch (err) {
        currentCart = [];
      }

      const existingIndex = currentCart.findIndex(item => (item.product || item._id) === product._id);
      
      if (existingIndex > -1) {
        const newQuantity = currentCart[existingIndex].quantity + qty;
        currentCart[existingIndex].quantity = newQuantity <= product.amount ? newQuantity : product.amount;
      } else {
        currentCart.push({
          _id: product._id,
          product: product._id,
          name: product.name,
          price: product.price,
          img: product.img,
          amount: product.amount,
          local: product.local || 'Cơ sở 1',
          quantity: qty
        });
      }

      const response = await axios.post('/api/cart/u', { items: currentCart }, {
        withCredentials: true
      });

      if (response.data.success) {
        sessionStorage.setItem('cartItems', JSON.stringify(response.data.data));
        window.dispatchEvent(new Event('cartUpdated'));
        alert(`Đã thêm ${qty} sản phẩm vào giỏ hàng thành công!`);
      }
    } catch (error) {
      console.error('Lỗi thêm vào giỏ hàng:', error);
      alert(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
    }
  };

  // 2. Hàm xử lý nút "Mua ngay"
  const handleBuyNow = (e) => { 
    e.stopPropagation(); 
    if (!isAvailable) return;

    const buyNowItem = [{
      _id: product._id,
      product: product._id,
      name: product.name,
      price: product.price,
      img: product.img,
      amount: product.amount,
      local: product.local || 'Cơ sở 1',
      quantity: qty
    }];

    sessionStorage.setItem('checkoutItems', JSON.stringify(buyNowItem));
    navigate('/checkout');
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
          
        {/* Thông tin Người đăng (Hiển thị tên thật lấy qua API theo author ID) */}
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

          {/* Hàng hiển thị Vị trí và Ngày đăng */}
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

          {/* Bộ chọn số lượng mua */}
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