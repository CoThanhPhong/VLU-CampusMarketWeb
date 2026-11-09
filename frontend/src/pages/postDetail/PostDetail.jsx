import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, Package, UserRound, ShoppingCart, Share2, Heart, ImageOff } from "lucide-react";
import { getProductDetail, getProductOwnerId, normalizeUser } from "../../services/detailApi";
import "../../css/DetailPages.css";

const money = (value) => Number(value || 0).toLocaleString("vi-VN") + " đ";
const dateText = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cập nhật";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1); // <-- Thêm state cho Số lượng mua

  useEffect(() => {
    let alive = true;
    setLoading(true);
    
    // Tối ưu bằng Cache trước khi gọi API theo yêu cầu Leader
    const cached = sessionStorage.getItem('productsCache');
    if (cached) {
      const foundProduct = JSON.parse(cached).find(p => p._id === id);
      if (foundProduct) {
        setProduct(foundProduct);
        setLoading(false);
        return; // Dừng lại không cần gọi API nếu đã có cache
      }
    }

    // Nếu không có cache, gọi API lấy dữ liệu thực
    getProductDetail(id)
      .then((data) => { if (alive) setProduct(data); })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="detail-state">Đang tải thông tin bài đăng...</div>;
  if (error || !product) return (
    <div className="detail-state detail-error">
      <h2>Không thể tải bài đăng</h2>
      <p>{error || "Bài đăng không tồn tại hoặc đã bị xóa."}</p>
      <button className="detail-btn secondary" onClick={() => navigate(-1)}><ArrowLeft size={17}/> Quay lại</button>
    </div>
  );

  const ownerId = getProductOwnerId(product);
  const ownerRaw = product.author && typeof product.author === "object" ? product.author : null;
  const owner = ownerRaw ? normalizeUser(ownerRaw) : null;
  const image = product.img;
  const available = product.status === "Còn hàng" && product.amount > 0;

  // Logic nút Tăng/Giảm số lượng mua
  const handleDecrease = () => setQty(q => Math.max(1, q - 1));
  const handleIncrease = () => setQty(q => Math.min(product.amount, q + 1));

  return (
    <section className="detail-page">
      <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={17}/> Quay lại</button>
      <div className="post-detail-grid">
        
        {/* CỘT TRÁI: HÌNH ẢNH SẢN PHẨM */}
        <div className="post-image-panel">
          {image ? <img className="post-main-image" src={image} alt={product.name} onError={(e) => { e.currentTarget.style.display = "none"; }} /> :
            <div className="image-placeholder"><ImageOff size={42}/><span>Chưa có hình ảnh</span></div>}
          <div className="image-caption"><span><ImageOff size={15}/> Hình ảnh sản phẩm</span><span>{product.deviceType || "Sản phẩm"}</span></div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT SẢN PHẨM */}
        <div className="post-info-panel">
          <div className="detail-eyebrow">CHI TIẾT BÀI ĐĂNG</div>
          <div className="post-title-row">
            <h1>{product.name || "Sản phẩm chưa có tên"}</h1>
            <span className={`status-pill ${available ? "available" : "unavailable"}`}>{product.status || "Chưa rõ trạng thái"}</span>
          </div>
          <div className="post-price">{money(product.price)}</div>
          <p className="post-description">{product.description || "Người bán chưa cung cấp mô tả cho sản phẩm này."}</p>

          <div className="detail-facts">
            <div><Package size={18}/><span>Số lượng kho</span><strong>{product.amount ?? "—"}</strong></div>
            <div><MapPin size={18}/><span>Địa điểm</span><strong>{product.local || "Chưa cập nhật"}</strong></div>
            <div><CalendarDays size={18}/><span>Ngày đăng</span><strong>{dateText(product.startDate || product.createdAt)}</strong></div>
            {product.endDate && <div><CalendarDays size={18}/><span>Ngày kết thúc</span><strong>{dateText(product.endDate)}</strong></div>}
          </div>

          {/* BỘ CHỌN SỐ LƯỢNG MUA THÊM VÀO */}
          {available && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '16px 0', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: '600', color: '#334155' }}>Chọn số lượng mua:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff' }}>
                <button onClick={handleDecrease} style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#475569' }}>-</button>
                <span style={{ padding: '0 16px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                <button onClick={handleIncrease} style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px', color: '#475569' }}>+</button>
              </div>
            </div>
          )}

          {/* CÁC NÚT HÀNH ĐỘNG (Đã đổi sang Mua ngay & Thêm giỏ hàng) */}
          <div className="post-actions" style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="detail-btn primary" 
              disabled={!available} 
              style={{ flex: 1, backgroundColor: available ? '#dc2626' : '#94a3b8', border: 'none' }} 
              onClick={() => alert(`Đã chuyển tới trang thanh toán cho ${qty} sản phẩm!`)}>
              {available ? `Mua ngay (${qty})` : "Sản phẩm đã hết hàng"}
            </button>
            <button 
              className="detail-btn secondary" 
              disabled={!available} 
              style={{ flex: 1, backgroundColor: available ? '#10b981' : '#f1f5f9', color: available ? 'white' : '#64748b', border: 'none' }} 
              onClick={() => alert(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`)}>
              <ShoppingCart size={17}/> {available ? "Thêm vào giỏ" : "Hết hàng"}
            </button>
            <button className="detail-icon-btn" aria-label="Lưu bài đăng" title="Lưu bài đăng"><Heart size={18}/></button>
          </div>

          {/* THÔNG TIN NGƯỜI BÁN (Giữ nguyên liên kết sang Trang Cá Nhân) */}
          <div className="seller-card">
            <div className="seller-card-heading">THÔNG TIN NGƯỜI BÁN</div>
            <div className="seller-row">
              {owner?.avatar ? <img src={owner.avatar} alt="" className="seller-avatar"/> : <div className="seller-avatar fallback"><UserRound size={22}/></div>}
              <div className="seller-copy">
                <strong>{owner?.name || "Người bán CampusMarket"}</strong>
                <span>{owner?.email || "Thông tin liên hệ được cung cấp trong hồ sơ"}</span>
              </div>
              {ownerId && <Link className="seller-profile-link" to={`/user/${ownerId}`}>Xem hồ sơ</Link>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
