import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, CalendarDays, Package, UserRound, MessageCircle, Share2, Heart, ImageOff } from "lucide-react";
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

  useEffect(() => {
    let alive = true;
    setLoading(true);
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
  const available = product.status === "Còn hàng";

  return (
    <section className="detail-page">
      <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={17}/> Quay lại</button>
      <div className="post-detail-grid">
        <div className="post-image-panel">
          {image ? <img className="post-main-image" src={image} alt={product.name} onError={(e) => { e.currentTarget.style.display = "none"; }} /> :
            <div className="image-placeholder"><ImageOff size={42}/><span>Chưa có hình ảnh</span></div>}
          <div className="image-caption"><span><ImageOff size={15}/> Hình ảnh sản phẩm</span><span>{product.deviceType || "Sản phẩm"}</span></div>
        </div>

        <div className="post-info-panel">
          <div className="detail-eyebrow">CHI TIẾT BÀI ĐĂNG</div>
          <div className="post-title-row">
            <h1>{product.name || "Sản phẩm chưa có tên"}</h1>
            <span className={`status-pill ${available ? "available" : "unavailable"}`}>{product.status || "Chưa rõ trạng thái"}</span>
          </div>
          <div className="post-price">{money(product.price)}</div>
          <p className="post-description">{product.description || "Người bán chưa cung cấp mô tả cho sản phẩm này."}</p>

          <div className="detail-facts">
            <div><Package size={18}/><span>Số lượng</span><strong>{product.amount ?? "—"}</strong></div>
            <div><MapPin size={18}/><span>Địa điểm</span><strong>{product.local || "Chưa cập nhật"}</strong></div>
            <div><CalendarDays size={18}/><span>Ngày đăng</span><strong>{dateText(product.startDate || product.createdAt)}</strong></div>
            {product.endDate && <div><CalendarDays size={18}/><span>Ngày kết thúc</span><strong>{dateText(product.endDate)}</strong></div>}
          </div>

          <div className="post-actions">
            <button className="detail-btn primary" disabled={!available}><MessageCircle size={17}/> {available ? "Liên hệ người bán" : "Sản phẩm đã hết hàng"}</button>
            <button className="detail-btn secondary" onClick={() => {
              if (navigator.share) navigator.share({ title: product.name, text: product.description, url: window.location.href }).catch(() => {});
              else navigator.clipboard?.writeText(window.location.href);
            }}><Share2 size={17}/> Chia sẻ</button>
            <button className="detail-icon-btn" aria-label="Lưu bài đăng" title="Lưu bài đăng"><Heart size={18}/></button>
          </div>

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
