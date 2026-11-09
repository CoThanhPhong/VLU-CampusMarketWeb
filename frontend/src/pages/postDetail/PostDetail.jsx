import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, Package, UserRound, ShoppingCart, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";
import { getProductDetail, getProductOwnerId, normalizeUser } from "../../services/detailApi";
import axios from "axios";
import "../../css/ProductDetail.css";

const money = (value) => Number(value || 0).toLocaleString("vi-VN") + " đ";
const dateText = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cập nhật";

export default function PostDetail() {
  const { id } = useParams();
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

  useEffect(() => {
    let alive = true;
    setLoading(true);
    
    const cached = sessionStorage.getItem('productsCache');
    if (cached) {
      try {
        const foundProduct = JSON.parse(cached).find(p => p._id === id);
        if (foundProduct) {
          setProduct(foundProduct);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Lỗi đọc cache:", e);
      }
    }

    getProductDetail(id)
      .then((data) => { if (alive) setProduct(data); })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [id]);

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
      <button className="detail-btn secondary" onClick={() => navigate(-1)}><ArrowLeft size={17}/> Quay lại</button>
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

  return (
    <section className="detail-page">
      <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={17}/> Quay lại</button>
      <div className="post-detail-grid">
        
        {/* CỘT TRÁI: HÌNH ẢNH SẢN PHẨM & THUMBNAIL */}
        <div className="post-image-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ 
              position: 'absolute', top: '12px', left: '12px', zIndex: 5,
              backgroundColor: '#334155', color: '#ffffff', 
              fontSize: '12px', fontWeight: '600', padding: '5px 10px', borderRadius: '6px' 
            }}>
              {deviceLabels[product?.deviceType] || product?.deviceType || 'Sản phẩm'}
            </span>

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
                    <button onClick={handlePrevImage} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleNextImage} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="image-placeholder"><ImageOff size={42}/><span>Chưa có hình ảnh</span></div>
            )}
          </div>

          {imageList.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {imageList.map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveImageIndex(idx)}
                  style={{ 
                    width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                    border: activeImageIndex === idx ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    opacity: activeImageIndex === idx ? 1 : 0.75,
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: CHI TIẾT SẢN PHẨM & THÔNG TIN NGƯỜI BÁN NẰM DƯỚI NÚT BẤM */}
        <div className="post-info-panel">
          <div className="detail-eyebrow">CHI TIẾT BÀI ĐĂNG</div>
          <div className="post-title-row">
            <h1>{product.name || "Sản phẩm chưa có tên"}</h1>
            <span className={`status-pill ${available ? "available" : "unavailable"}`}>
              {product.status || "Chưa rõ trạng thái"}
            </span>
          </div>
          <div className="post-price">{money(product.price)}</div>
          <p className="post-description">{product.description || "Người bán chưa cung cấp mô tả cho sản phẩm này."}</p>

          <div className="detail-facts">
            <div><Package size={16}/><span>Số lượng kho</span><strong>{product.amount ?? "—"}</strong></div>
            <div><MapPin size={16}/><span>Địa điểm</span><strong>{product.local || "Chưa cập nhật"}</strong></div>
            <div><CalendarDays size={16}/><span>Ngày đăng</span><strong>{dateText(product.startDate || product.createdAt)}</strong></div>
            {product.endDate && <div><CalendarDays size={16}/><span>Ngày kết thúc</span><strong>{dateText(product.endDate)}</strong></div>}
          </div>

          {/* BỘ CHỌN SỐ LƯỢNG MUA */}
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

          {/* CÁC NÚT HÀNH ĐỘNG */}
          <div className="post-actions" style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="detail-btn primary" 
              disabled={!available} 
              style={{ flex: 1 }} 
              onClick={() => alert(`Đã chuyển tới trang thanh toán cho ${qty} sản phẩm!`)}>
              {available ? `Mua ngay (${qty})` : "Sản phẩm đã hết hàng"}
            </button>
            <button 
              className="detail-btn secondary" 
              disabled={!available} 
              style={{ flex: 1 }} 
              onClick={() => alert(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`)}>
              <ShoppingCart size={17}/> {available ? "Thêm vào giỏ" : "Hết hàng"}
            </button>
          </div>

          {/* THÔNG TIN NGƯỜI BÁN (Nằm gọn gàng ở cột phải, loại bỏ hoàn toàn khoảng trống) */}
          <div 
            onClick={() => {
              if (authorInfo.id && authorInfo.id !== '#') {
                navigate(`/user/${authorInfo.id}`);
              }
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '12px 16px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '10px', 
              border: '1px solid #e2e8f0', 
              cursor: 'pointer', 
              transition: 'background 0.2s',
              marginTop: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            title="Nhấn để xem trang thông tin người bán"
          >
            {authorInfo?.avatar ? (
              <img 
                src={authorInfo.avatar} 
                alt={authorInfo?.name} 
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} 
              />
            ) : (
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserRound size={22}/>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Người đăng bán</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{authorInfo?.name || "Thành viên VLU"}</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}