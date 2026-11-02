import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Package, CalendarDays, UserRound, Mail, Phone, GraduationCap, Search } from "lucide-react";
import { getProducts, getUserDetail, getProductOwnerId, normalizeUser } from "../../services/detailApi";
import "../../css/DetailPages.css";

const money = (value) => Number(value || 0).toLocaleString("vi-VN") + " đ";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getUserDetail(id), getProducts()])
      .then(([rawUser, allProducts]) => {
        if (!alive) return;
        setUser(normalizeUser(rawUser));
        setProducts(allProducts.filter((item) => getProductOwnerId(item) === String(id)));
      })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const filteredProducts = useMemo(() => products.filter((item) =>
    String(item.name || "").toLowerCase().includes(query.toLowerCase())
  ), [products, query]);

  if (loading) return <div className="detail-state">Đang tải hồ sơ người dùng...</div>;
  if (error || !user) return (
    <div className="detail-state detail-error">
      <h2>Không thể tải hồ sơ</h2><p>{error || "Không tìm thấy người dùng."}</p>
      <button className="detail-btn secondary" onClick={() => navigate(-1)}><ArrowLeft size={17}/> Quay lại</button>
    </div>
  );

  return (
    <section className="detail-page user-detail-page">
      <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={17}/> Quay lại</button>
      <div className="profile-cover">
        <div className="profile-cover-pattern"/>
        <div className="profile-main">
          {user.avatar ? <img src={user.avatar} alt={user.name} className="profile-avatar"/> : <div className="profile-avatar profile-avatar-fallback"><UserRound size={42}/></div>}
          <div className="profile-heading">
            <span className="detail-eyebrow">HỒ SƠ THÀNH VIÊN</span>
            <h1>{user.name}</h1>
            <p><GraduationCap size={16}/> {user.mssv || "Thành viên VLU"}</p>
          </div>
          <div className="profile-count"><strong>{products.length}</strong><span>Bài đăng</span></div>
        </div>
      </div>

      <div className="profile-content-grid">
        <aside className="profile-about card-surface">
          <h2>Giới thiệu</h2>
          <p className="profile-bio">{user.bio}</p>
          <div className="profile-contact">
            <div><Mail size={17}/><span>{user.email || "Chưa cập nhật email"}</span></div>
            <div><Phone size={17}/><span>{user.phone || "Chưa cập nhật số điện thoại"}</span></div>
            <div><GraduationCap size={17}/><span>{user.mssv || "Chưa cập nhật MSSV"}</span></div>
            <div><CalendarDays size={17}/><span>Tham gia: {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Thành viên CampusMarket"}</span></div>
          </div>
        </aside>

        <div className="profile-listings">
          <div className="listing-heading">
            <div><span className="detail-eyebrow">GIAN HÀNG CÁ NHÂN</span><h2>Bài đăng của {user.name}</h2></div>
            <label className="listing-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm trong bài đăng..."/></label>
          </div>
          {filteredProducts.length ? (
            <div className="profile-product-grid">
              {filteredProducts.map((item) => (
                <Link to={`/post/${item._id}`} className="profile-product-card" key={item._id}>
                  {item.img ? <img src={item.img} alt={item.name}/> : <div className="product-placeholder"><Package size={28}/></div>}
                  <div className="profile-product-copy">
                    <span className={`status-pill small ${item.status === "Còn hàng" ? "available" : "unavailable"}`}>{item.status || "Chưa rõ"}</span>
                    <h3>{item.name}</h3>
                    <strong>{money(item.price)}</strong>
                    <span className="product-location"><MapPin size={14}/>{item.local || "Chưa cập nhật"}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-listings"><Package size={32}/><strong>{query ? "Không tìm thấy bài đăng phù hợp" : "Chưa có bài đăng nào"}</strong><span>Các bài đăng của người dùng sẽ hiển thị tại đây.</span></div>
          )}
        </div>
      </div>
    </section>
  );
}
