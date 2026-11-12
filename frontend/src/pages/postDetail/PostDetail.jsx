import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, Package, UserRound, ShoppingCart, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import {getProductDetail, getProductOwnerId, normalizeUser } from "../../services/detailApi"
import "../../css/ProductDetail.css";
import "../../css/CustomModal.css";

const money = (value) => Number(value || 0).toLocaleString("vi-VN") + " đ";
const dateText = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cập nhật";

export default function PostDetail() {
  const { id } = useParams();
  const location = useLocation()
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [authorInfo, setAuthorInfo] = useState({ name: 'Thành viên VLU', avatar: '', id: '#' });

  const deviceLabels = { 
    mobile: 'Điện thoại', 
    tablet: 'Máy tính bảng', 
    laptop: 'Laptop', 
    mac: 'Macbook' 
  };

  // SỬA TRIỆT ĐỂ: Luôn gọi API chuẩn theo ID trên URL, bỏ qua cache cũ gây lệch dữ liệu
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setProduct(null); // Reset product cũ khi đổi sang id mới

    getProductDetail(id)
      .then((data) => {
        if (alive) {
          if (data) {
            setProduct(data);
          } else {
            setError("Không tìm thấy thông tin sản phẩm.");
          }
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err.message || 'Không thể tải chi tiết sản phẩm');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { 
      alive = false; 
    };
  }, [id]); // Lắng nghe sự thay đổi của id trên URL để fetch đúng dữ liệu

  useEffect(() => {
    let alive = true;
    const resolveAuthor = async () => {
      if (!product) return;
      const rawAuthor = product.author;
      const resolvedId = getProductOwnerId(product);
      if (!rawAuthor) {
        if (alive) setAuthorInfo({ name: 'Thành viên VLU', avatar: '', id: resolvedId || '#' });
        return;
      }

      if (typeof rawAuthor === 'object' && rawAuthor !== null) {
        const normalized = normalizeUser(rawAuthor);
        if (alive) {
          setAuthorInfo({
            name: normalized.name || 'Thành viên VLU',
            avatar: normalized.avatar || '',
            id: resolvedId || '#'
          });
        }
        return;
      }

      try {
        const response = await axios.post('/api/auth/user', { id: String(rawAuthor) });
        const resData = response.data;
        const userData = resData?.data || resData?.user || resData;
        const normalized = normalizeUser(userData);
        if (alive) {
          setAuthorInfo({
            name: normalized.name || 'Thành viên VLU',
            avatar: normalized.avatar || '',
            id: String(rawAuthor)
          });
        }
      } catch (err) {
        console.error('Lỗi lấy thông tin tác giả:', err);
        if (alive) {
          setAuthorInfo({ name: 'Thành viên VLU', avatar: '', id: String(rawAuthor) });
        }
      }
    };

    resolveAuthor();
    return () => { alive = false; };
  }, [product]);

  if (loading) return <div className="detail-state">Đang tải thông tin bài đăng...</div>;
  if (error || !product) return (
    <div className="detail-state detail-error">
      <h2>Không thể tải bài đăng</h2>
      <p>{error || "Bài đăng không tồn tại hoặc đã bị xóa."}</p>
      <button className="detail-btn secondary" onClick={handleGoBack}><ArrowLeft size={17}/> Quay lại</button>
    </div>
  );

  const available = product.status === "Còn hàng" && product.amount > 0;

  let imageList = [];
  if (Array.isArray(product.img) && product.img.length > 0) {
    imageList = product.img.filter(Boolean).slice(0, 5);
  } else if (typeof product.img === 'string' && product.img.trim() !== '') {
    imageList = [product.img];
  } else if (Array.isArray(product.images) && product.images.length > 0) {
    imageList = product.images.filter(Boolean).slice(0, 5);
  }

  const handleDecrease = () => setQty(q => Math.max(1, q - 1));
  const handleIncrease = () => setQty(q => Math.min(product.amount || 1, q + 1));

  const handlePrevImage = () => {
    setActiveImageIndex(prev => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex(prev => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const handleAddToCart = async () => {
    if (!available) return;
    try {
      let currentCart = [];
      const savedCart = sessionStorage.getItem('cartItems');
      if (savedCart) currentCart = JSON.parse(savedCart);

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
          img: imageList[0] || '',
          amount: product.amount,
          local: product.local || 'Cơ sở 1',
          quantity: qty
        });
      }

      const response = await axios.post('/api/cart/u', { items: currentCart }, { withCredentials: true });
      if (response.data.success) {
        sessionStorage.setItem('cartItems', JSON.stringify(response.data.data));
        window.dispatchEvent(new Event('cartUpdated'));
        alert(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    }
  };

  const handleBuyNow = () => {
    if (!available) return;
    const buyNowItem = [{
      _id: product._id,
      product: product._id,
      name: product.name,
      price: product.price,
      img: imageList[0] || '',
      amount: product.amount,
      local: product.local || 'Cơ sở 1',
      quantity: qty
    }];
    sessionStorage.setItem('checkoutItems', JSON.stringify(buyNowItem));
    navigate('/checkout');
  };

  const handleGoBack = () => {
    const previousPage = location.state?.fromPage;
    if (previousPage) {
      navigate(`/home?page=${previousPage}`); // Quay lại đúng trang (VD: trang 3)
    } else {
      navigate(-1); // Quay lại lịch sử thông thường nếu không có state
    }
  };

  return (
    <section className="detail-page">
      <button className="back-link" onClick={handleGoBack}><ArrowLeft size={16}/> Quay lại</button>
      
      <div className="post-detail-grid">
        
        {/* CỘT TRÁI: ẢNH CHÍNH & THUMBNAILS */}
        <div className="post-image-panel">
          {imageList.length > 0 && imageList[activeImageIndex] ? (
            <div style={{ position: 'relative' }}>
              <img 
                className="post-main-image" 
                src={imageList[activeImageIndex]} 
                alt={product.name} 
                onError={(e) => { e.currentTarget.style.display = "none"; }} 
              />
              {imageList.length > 1 && (
                <>
                  <button onClick={handlePrevImage} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={handleNextImage} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="image-placeholder"><ImageOff size={42}/><span>Chưa có hình ảnh</span></div>
          )}

          {imageList.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingBottom: '4px' }}>
              {imageList.map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  style={{ 
                    width: '70px', height: '70px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                    border: activeImageIndex === idx ? '2px solid #2563eb' : '2px solid transparent',
                    opacity: activeImageIndex === idx ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
        <div className="post-info-panel">
          <div>
            <span style={{ display: 'inline-block', backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', marginBottom: '8px' }}>
              {deviceLabels[product?.deviceType] || product?.deviceType || 'Sản phẩm'}
            </span>
            <div className="post-title-row">
              <h1>{product.name || "Sản phẩm chưa có tên"}</h1>
              <span className={`status-pill ${available ? "available" : "unavailable"}`}>
                {product.status || "Chưa rõ trạng thái"}
              </span>
            </div>
          </div>

          <div className="post-price">{money(product.price)}</div>
          
          <p className="post-description">
            {product.description || "Người bán chưa cung cấp mô tả chi tiết cho sản phẩm này."}
          </p>

          {/* CÁC THÔNG SỐ (FACTS) & TÁC GIẢ NẰM DƯỚI ĐỊA ĐIỂM */}
          <div className="detail-facts">
            <div className="fact-item">
              <Package size={18} color="#2563eb"/>
              <div>
                <div style={{ fontSize: '11px' }}>Số lượng kho</div>
                <strong>{product.amount ?? "—"} sản phẩm</strong>
              </div>
            </div>

            <div className="fact-item">
              <MapPin size={18} color="#dc2626"/>
              <div>
                <div style={{ fontSize: '11px' }}>Địa điểm giao dịch</div>
                <strong>{product.local || "Cơ sở 1"}</strong>
              </div>
            </div>

            {/* Thông tin tác giả nằm ngay dưới phần địa điểm */}
            <div 
              onClick={() => { if (authorInfo.id && authorInfo.id !== '#') navigate(`/user/${authorInfo.name}`, { state: { id: authorInfo.id }}); }}
              className="fact-item"
              style={{ gridColumn: 'span 2', cursor: 'pointer', backgroundColor: '#f8fafc', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              title="Nhấn để xem trang cá nhân người đăng"
            >
              {authorInfo?.avatar ? (
                <img src={authorInfo.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserRound size={20} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Người đăng bán</div>
                <strong style={{ fontSize: '14px', color: '#2563eb' }}>{authorInfo?.name || "Thành viên VLU"}</strong>
              </div>
            </div>

            <div className="fact-item" style={{ gridColumn: 'span 2' }}>
              <CalendarDays size={18} color="#059669"/>
              <div>
                <div style={{ fontSize: '11px' }}>Ngày đăng tin</div>
                <strong>{dateText(product.startDate || product.createdAt)}</strong>
              </div>
            </div>
          </div>

          {/* CHỌN SỐ LƯỢNG */}
          {available && (
            <div className="quantity-selector-box">
              <span style={{ fontWeight: '600', color: '#334155', fontSize: '13px' }}>Chọn số lượng mua:</span>
              <div className="quantity-controls">
                <button onClick={handleDecrease}>-</button>
                <span>{qty}</span>
                <button onClick={handleIncrease}>+</button>
              </div>
            </div>
          )}

          {/* NÚT HÀNH ĐỘNG */}
          <div className="post-actions">
            <button className="detail-btn primary" disabled={!available} onClick={handleBuyNow}>
              {available ? `Mua ngay (${qty})` : "Sản phẩm đã hết hàng"}
            </button>
            <button className="detail-btn secondary" disabled={!available} onClick={handleAddToCart}>
              <ShoppingCart size={18}/> {available ? "Thêm vào giỏ" : "Hết hàng"}
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}