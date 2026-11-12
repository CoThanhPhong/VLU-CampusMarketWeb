import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import '../../css/CustomModal.css';

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const [qty, setQty] = useState(1); // State quản lý số lượng mua trực tiếp trên card
  
  const [authorName, setAuthorName] = useState('Đang tải...');
  const [authorId, setAuthorId] = useState('#');
  const [currentUserId, setCurrentUserId] = useState(null);

  const [addedEffect, setAddedEffect] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (msg, type = 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const isAvailable = product?.status === 'Còn hàng' && product?.amount > 0;
  
  const deviceLabels = { 
    mobile: 'Điện thoại', 
    tablet: 'Máy tính bảng', 
    laptop: 'Laptop', 
    mac: 'Macbook' 
  };

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const userId = parsed._id || parsed.id || parsed.profile?.id || parsed.profile?._id;
        if (userId) setCurrentUserId(String(userId));
      }
    } catch (err) {
      console.warn("Không thể lấy thông tin current user:", err);
    }
  }, []);

  const getProductImage = () => {
    if (Array.isArray(product?.img) && product.img.length > 0) {
      const firstValidImg = product.img.find(img => typeof img === 'string' && img.trim() !== '');
      if (firstValidImg) return firstValidImg;
    }
    if (typeof product?.img === 'string' && product.img.trim() !== '') return product.img;
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const firstValidImages = product.images.find(img => typeof img === 'string' && img.trim() !== '');
      if (firstValidImages) return firstValidImages;
    }
    return 'https://via.placeholder.com/300x170?text=No+Image';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Gần đây';
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);
    if (diffInSeconds < 60) return 'Vừa xong';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return past.toLocaleDateString('vi-VN');
  };

  const isNewPost = () => {
    const postDate = product?.createdAt || product?.startDate;
    if (!postDate) return false;
    return (new Date() - new Date(postDate)) / (1000 * 60 * 60) <= 24;
  };

  useEffect(() => {
    let alive = true;
    const resolveAuthor = async () => {
      const rawAuthor = product?.author;
      if (!rawAuthor) {
        if (alive) { setAuthorName('Thành viên VLU'); setAuthorId('#'); }
        return;
      }
      if (typeof rawAuthor === 'object' && rawAuthor !== null) {
        if (alive) {
          setAuthorId(String(rawAuthor._id || rawAuthor.id || '#'));
          setAuthorName(rawAuthor.profile?.name || rawAuthor.name || 'Thành viên VLU');
        }
        return;
      }
      if (alive) setAuthorId(String(rawAuthor));
      try {
        const response = await axios.post('/api/auth/user', { id: String(rawAuthor) });
        const userData = response.data?.data || response.data?.user || response.data;
        if (userData?.profile?.name && alive) setAuthorName(userData.profile.name);
      } catch (error) {
        if (alive) setAuthorName('Thành viên VLU');
      }
    };
    resolveAuthor();
    return () => { alive = false; };
  }, [product?.author]);

  const isOwner = currentUserId && authorId && currentUserId === authorId;

  const handleDecrease = (e) => { 
    e.stopPropagation(); 
    setQty(p => p > 1 ? p - 1 : 1); 
  };
  
  const handleIncrease = (e) => { 
    e.stopPropagation(); 
    setQty(p => p < (product.amount || 1) ? p + 1 : (product.amount || 1)); 
  };

  const handleAddToCart = async (e) => { 
    e.stopPropagation(); 
    if (!isAvailable || addedEffect) return;

    try {
      let currentCart = [];
      try {
        const savedCart = sessionStorage.getItem('cartItems');
        if (savedCart) currentCart = JSON.parse(savedCart);
      } catch (err) { currentCart = []; }

      const existingIndex = currentCart.findIndex(item => (item.product || item._id) === product._id);
      if (existingIndex > -1) {
        const newQuantity = currentCart[existingIndex].quantity + qty;
        currentCart[existingIndex].quantity = newQuantity <= product.amount ? newQuantity : product.amount;
      } else {
        currentCart.push({
          _id: product._id, product: product._id, name: product.name,
          price: product.price, img: getProductImage(), amount: product.amount,
          local: product.local || 'Cơ sở 1', quantity: qty
        });
      }

      const response = await axios.post('/api/cart/u', { items: currentCart }, { withCredentials: true });
      if (response.data.success) {
        sessionStorage.setItem('cartItems', JSON.stringify(response.data.data));
        window.dispatchEvent(new Event('cartUpdated'));
        setAddedEffect(true);
        setTimeout(() => setAddedEffect(false), 1500);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng.', 'error');
    }
  };

  const handleBuyNow = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;
    const buyNowItem = [{
      _id: product._id,
      product: product._id,
      name: product.name,
      price: product.price,
      img: getProductImage(),
      amount: product.amount,
      local: product.local || 'Cơ sở 1',
      quantity: qty
    }];
    sessionStorage.setItem('checkoutItems', JSON.stringify(buyNowItem));
    navigate('/checkout');
  };

  return (
    <div 
      onClick={() => currentUserId != authorId?navigate(`/product/${product?._id}`): navigate(`/create-post?edit=${product._id}`)}
      style={{ backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {notification && (
        <div className="custom-toast-container">
          <div className="custom-toast error">
            <AlertCircle size={18} /> {notification.msg}
          </div>
        </div>
      )}

      <div>
        {/* Hình ảnh và nhãn trạng thái */}
        <div style={{ position: 'relative', width: '100%', height: '170px', backgroundColor: '#f1f5f9' }}>
          <img src={getProductImage()} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          
          <span style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: '#334155', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '4px' }}>
            {deviceLabels[product?.deviceType] || product?.deviceType || 'Sản phẩm'}
          </span>

          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
            {isNewPost() && (
              <span style={{ backgroundColor: '#f59e0b', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' }}>Mới</span>
            )}
            <span style={{ backgroundColor: isAvailable ? '#16a34a' : '#64748b', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '4px' }}>
              {product?.status || 'Còn hàng'}
            </span>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight:"44px" }}>
            {product?.name}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc2626', marginBottom: '6px' }}>
            {product?.price ? product.price.toLocaleString('vi-VN') : 0} <span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>VNĐ</span>
          </div>
          
          <div 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (authorId === '#') showToast('Bài viết cũ chưa có dữ liệu người đăng!');
              else navigate(`/user/${authorId}`); 
            }}
            style={{ fontSize: '13px', color: '#2563eb', cursor: 'pointer', marginBottom: '8px' }}
          >
            Người đăng: <b>{authorName}</b>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>📍 {product?.local || 'Cơ sở 1'}</span>
            <span>🕒 {formatTimeAgo(product?.createdAt || product?.startDate)}</span>
          </div>

          {/* Bộ điều chỉnh số lượng mua nhanh ngay trên card (nếu không phải chủ bài viết) */}
          {!isOwner && (
            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', padding: '4px 8px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={handleDecrease} style={{ padding: '2px 8px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>-</button>
                <span style={{ fontSize: '13px', padding: '0 8px', fontWeight: '600' }}>{qty}</span>
                <button onClick={handleIncrease} style={{ padding: '2px 8px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}>+</button>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>(Kho: {product?.amount || 0})</span>
            </div>
          )}
        </div>
      </div>

      {/* Khu vực nút hành động */}
      <div style={{ padding: '0 12px 12px 12px' }}>
        {isOwner ? (
          <button onClick={(e) => { e.stopPropagation(); navigate(`/create-post?edit=${product._id}`); }} style={{ width: '100%', padding: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Pencil size={14} /> Chỉnh sửa bài viết
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleBuyNow} 
              disabled={!isAvailable} 
              style={{ flex: 1, padding: '8px 0', backgroundColor: isAvailable ? '#dc2626' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: isAvailable ? 'pointer' : 'not-allowed' }}
            >
              Mua ngay
            </button>
            <button 
              onClick={handleAddToCart} 
              disabled={!isAvailable} 
              style={{ flex: 1, padding: '8px 0', backgroundColor: addedEffect ? '#15803d' : (isAvailable ? '#10b981' : '#f1f5f9'), color: isAvailable ? '#fff' : '#94a3b8', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: isAvailable ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              {addedEffect ? <><Check size={14} /> Đã thêm</> : 'Thêm giỏ hàng'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}