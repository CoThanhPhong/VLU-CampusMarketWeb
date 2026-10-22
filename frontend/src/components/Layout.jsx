import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "./Icons";
import { USE_MOCK } from "../services/api";

// Khung trang (thanh trên cùng + chân trang) để 2 trang chạy độc lập.
// Nếu nhóm đã có Navbar/Footer riêng thì bỏ <Layout> và đặt 2 trang vào layout của nhóm.
export default function Layout({ children }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
  }

  return (
    <div className="cm-app cm-scope">
      <header className="cm-header">
        <div className="cm-container cm-header__inner">
          <Link to="/" className="cm-brand" aria-label="VLU Campus Market - Trang chủ">
            <span className="cm-brand__mark">
              <Icon name="bag" size={19} />
            </span>
            <span className="cm-brand__text">
              VLU Campus Market
              <small>Chợ đồ công nghệ sinh viên</small>
            </span>
          </Link>

          <form className="cm-search" role="search" onSubmit={handleSearch}>
            <Icon name="search" size={18} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm iPhone, MacBook, laptop..."
              aria-label="Tìm kiếm tin đăng"
            />
          </form>

          <nav className="cm-nav" aria-label="Điều hướng chính">
            <Link to="/">Trang chủ</Link>
            <Link to="/profile" className="cm-nav__me">
              <Icon name="user" size={16} /> Hồ sơ của tôi
            </Link>
          </nav>
        </div>
      </header>

      <div className="cm-main">{children}</div>

      <footer className="cm-footer">
        <div className="cm-container">
          <span>© VLU Campus Market · Đồ án môn học</span>
          <span>Giao dịch an toàn ngay tại khuôn viên trường</span>
        </div>
      </footer>

      {USE_MOCK && (
        <span className="cm-mockpill" title="Đặt VITE_USE_MOCK=false để dùng backend thật">
          Dữ liệu mẫu
        </span>
      )}
    </div>
  );
}
