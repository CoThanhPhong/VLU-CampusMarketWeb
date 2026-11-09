import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, CalendarDays, UserRound, Mail, Phone, GraduationCap, Search, Pencil } from "lucide-react";
import { getProducts, getProductOwnerId } from "../../services/detailApi";
import ProductCard from "../../components/Route/ProductCard";
import axios from "axios";
import "../../css/Profile.css";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState(null);

  // 1. Lấy thông tin current user từ session/local storage khi component mount
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const userId = parsed._id || parsed.id || parsed.profile?.id || parsed.profile?._id;
        if (userId) {
          setCurrentUserId(String(userId));
        }
      }
    } catch (err) {
      console.warn("Không thể lấy thông tin current user từ storage:", err);
    }
  }, []);

  // 2. Kiểm tra xem profile đang xem có phải là current user hay không
  const isCurrentUser = useMemo(() => {
    if (!currentUserId || !id) return false;
    return String(currentUserId) === String(id);
  }, [currentUserId, id]);

  // 3. Tối ưu: Nếu là current user thì lấy từ session luôn, ngược lại mới gọi API
  useEffect(() => {
    let alive = true;
    setLoading(true);

    const fetchUserData = async () => {
      try {
        let rawUser = null;

        // KIỂM TRA: Nếu là chính mình và có dữ liệu trong storage -> Dùng luôn, không gọi API!
        if (isCurrentUser) {
          const storedUserStr = sessionStorage.getItem("user") || localStorage.getItem("user");
          if (storedUserStr) {
            const parsedStored = JSON.parse(storedUserStr);
            // Kiểm tra cấu trúc xem có phải object chứa profile hoặc phẳng
            rawUser = parsedStored.profile ? { ...parsedStored, ...parsedStored.profile } : parsedStored;
          }
        }

        // Nếu không phải current user hoặc trong storage không có, tiến hành gọi API
        if (!rawUser) {
          const userResponse = await axios.post("/api/auth/user", { id });
          const responseData = userResponse.data;
          const apiUser = responseData?.data || responseData?.user || responseData;
          rawUser = { ...apiUser, ...(apiUser.profile || {}) };
        }

        if (!alive) return;

        // Chuẩn hóa dữ liệu user để hiển thị lên giao diện
        const normalized = {
          id: rawUser._id || rawUser.id || id,
          name: rawUser.name || "Người dùng",
          email: rawUser.email || "",
          mssv: rawUser.mssv || "",
          phone: rawUser.phone || "",
          bio: rawUser.bio || "",
          avatar: rawUser.avatar || "",
          createdAt: rawUser.createdAt
        };

        setUser(normalized);

        // Lấy danh sách sản phẩm của user này
        const allProducts = await getProducts();
        if (!alive) return;
        setProducts(allProducts.filter((item) => getProductOwnerId(item) === String(id)));

      } catch (err) {
        if (alive) {
          setError(err.response?.data?.message || err.message);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => { 
      alive = false; 
    };
  }, [id, isCurrentUser]); // Theo dõi thêm `isCurrentUser` để kích hoạt lại khi trạng thái user thay đổi

  const filteredProducts = useMemo(() => products.filter((item) =>
    String(item.name || "").toLowerCase().includes(query.toLowerCase())
  ), [products, query]);

  if (loading) return <div className="detail-state">Đang tải hồ sơ người dùng...</div>;
  if (error || !user) return (
    <div className="detail-state detail-error">
      <h2>Không thể tải hồ sơ</h2><p>{error || "Không tìm thấy người dùng."}</p>
      <button className="detail-btn secondary" onClick={() => navigate(-1)}><ArrowLeft size={17}/>Quay lại</button>
    </div>
  );

  return (
    <section className="detail-page user-detail-page">
      <button className="back-link" onClick={() => navigate(-1)}><ArrowLeft size={17}/>Quay lại</button>
      
      {/* Khung profile chính */}
      <div className="profile-cover card-surface" style={{ position: "relative" }}>
        {/* Chỉ hiển thị nút chỉnh sửa nếu đúng là current user */}
        {isCurrentUser && (
          <Link to={`/settingProfile`} className="profile-settings-icon-btn" title="Chỉnh sửa hồ sơ">
            <Pencil size={18} />
          </Link>
        )}

        <div className="profile-main-centered">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="profile-avatar"/>
          ) : (
            <div className="profile-avatar profile-avatar-fallback"><UserRound size={42}/></div>
          )}
          
          <div className="profile-info-flex-row">
            <div className="profile-heading-centered">
              <h1>{user.name}</h1>
              <p><GraduationCap size={16}/>Thành viên VLU</p>
            </div>

            <div className="profile-count">
              <strong>{products.length}</strong>
              <span>Bài đăng</span>
            </div>
          </div>

          <div className="profile-extra-details-mobile">
            <div className="bio-line">{user.bio || "Chưa có giới thiệu."}</div>
            <div className="contact-line-2">
              <span><Mail size={14}/> {user.email || "Chưa cập nhật email"}</span>
              <span className="dot">•</span>
              <span><Phone size={14}/> {user.phone || "Chưa cập nhật SĐT"}</span>
            </div>
            <div className="contact-line-3">
              <span><GraduationCap size={14}/> {user.mssv || "Chưa cập nhật MSSV"}</span>
              <span className="dot">•</span>
              <span><CalendarDays size={14}/> Tham gia: {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "CampusMarket"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content-grid">
        <aside className="profile-about card-surface">
          <h2>Giới thiệu</h2>
          <p className="profile-bio">{user.bio || "Chưa có giới thiệu."}</p>
          <div className="profile-contact">
            <div><Mail size={17}/><span>{user.email || "Chưa cập nhật email"}</span></div>
            <div><Phone size={17}/><span>{user.phone || "Chưa cập nhật số điện thoại"}</span></div>
            <div><GraduationCap size={17}/><span>{user.mssv || "Chưa cập nhật MSSV"}</span></div>
            <div><CalendarDays size={17}/><span>Tham gia: {user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Thành viên CampusMarket"}</span></div>
          </div>
        </aside>

        <div className="profile-listings">
          <div className="listing-heading">
            <div><h2>Bài đăng của {user.name}</h2></div>
            <label className="listing-search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm trong bài đăng..."/></label>
          </div>
          {filteredProducts.length ? (
            <div className="profile-product-grid">
              {filteredProducts.map((item) => (
                <ProductCard key={item._id || item.id} product={item} />
              ))}
            </div>
          ) : (
            <div className="empty-listings">
              <Package size={32}/>
              <strong>{query ? "Không tìm thấy bài đăng phù hợp" : "Chưa có bài đăng nào"}</strong>
              <span>Các bài đăng của người dùng sẽ hiển thị tại đây.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}