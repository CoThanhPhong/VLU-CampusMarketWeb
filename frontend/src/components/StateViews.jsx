import { Link } from "react-router-dom";
import { Icon } from "./Icons";

/** Trạng thái rỗng (không có dữ liệu). */
export function EmptyState({ icon = "box", title, children }) {
  return (
    <div className="cm-empty">
      <span className="cm-empty__icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

/** Trạng thái lỗi toàn trang: 404 (không tìm thấy) khác với lỗi mạng/máy chủ. */
export function ErrorState({ error, onRetry, backTo = "/", backLabel = "Về trang chủ" }) {
  const notFound = error?.status === 404;
  return (
    <main className="cm-page cm-scope cm-container">
      <div className="cm-card cm-errorstate">
        <span className={`cm-empty__icon${notFound ? "" : " is-bad"}`}>
          <Icon name={notFound ? "search" : "alert"} size={30} />
        </span>
        <h1>{notFound ? "Không tìm thấy nội dung" : "Đã có lỗi xảy ra"}</h1>
        <p>{error?.message || "Vui lòng thử lại sau."}</p>
        <div className="cm-errorstate__actions">
          {!notFound && onRetry && (
            <button type="button" className="cm-btn cm-btn--primary" onClick={onRetry}>
              Thử lại
            </button>
          )}
          <Link to={backTo} className="cm-btn cm-btn--secondary">
            {backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}

const S = ({ className = "", style }) => <div className={`cm-skel ${className}`} style={style} />;

/** Khung xương hiển thị khi đang tải trang chi tiết bài đăng. */
export function DetailSkeleton() {
  return (
    <main className="cm-page cm-scope cm-container" aria-busy="true" aria-label="Đang tải tin đăng">
      <S style={{ width: 280, height: 16, marginBottom: 18 }} />
      <div className="cm-detail">
        <div className="cm-detail__main">
          <S style={{ aspectRatio: "4 / 3", borderRadius: 16 }} />
          <S style={{ height: 180, borderRadius: 16 }} />
        </div>
        <div className="cm-detail__side">
          <S style={{ height: 330, borderRadius: 16 }} />
          <S style={{ height: 190, borderRadius: 16 }} />
        </div>
      </div>
    </main>
  );
}

/** Khung xương hiển thị khi đang tải trang cá nhân. */
export function ProfileSkeleton() {
  return (
    <main className="cm-page cm-scope cm-container" aria-busy="true" aria-label="Đang tải hồ sơ">
      <S style={{ height: 300, borderRadius: 20 }} />
      <div className="cm-profile__layout" style={{ marginTop: 20 }}>
        <div className="cm-grid">
          {[0, 1, 2].map((i) => (
            <S key={i} style={{ height: 260, borderRadius: 14 }} />
          ))}
        </div>
        <S style={{ height: 280, borderRadius: 16 }} />
      </div>
    </main>
  );
}
