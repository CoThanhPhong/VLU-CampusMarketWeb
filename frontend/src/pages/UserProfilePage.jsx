import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProfilePage, updateUserProfile } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useToast } from "../hooks/useToast";
import { Icon } from "../components/Icons";
import Avatar from "../components/Avatar";
import ProductCard from "../components/ProductCard";
import EditProfileModal from "../components/EditProfileModal";
import { RevealRow } from "../components/ContactPanel";
import Toast from "../components/Toast";
import { EmptyState, ErrorState, ProfileSkeleton } from "../components/StateViews";
import { formatMonthYear, isUnavailable, maskStudentID } from "../utils/format";

const TABS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang bán" },
  { key: "ended", label: "Đã bán / hết hạn" },
];

export default function UserProfilePage() {
  const { id = "me" } = useParams();
  const { data, error, loading, reload, setData } = useAsync(() => getProfilePage(id), [id]);
  const { toast, show } = useToast();
  const [tab, setTab] = useState("all");
  const [editing, setEditing] = useState(false);
  const [showStudentID, setShowStudentID] = useState(false);

  useEffect(() => {
    setTab("all");
    setEditing(false);
    setShowStudentID(false);
  }, [id]);

  useEffect(() => {
    if (data?.user) document.title = `${data.user.name} | VLU Campus Market`;
  }, [data]);

  const counts = useMemo(() => {
    const products = data?.products ?? [];
    const active = products.filter((p) => !isUnavailable(p)).length;
    return { all: products.length, active, ended: products.length - active };
  }, [data]);

  const visible = useMemo(() => {
    const products = data?.products ?? [];
    if (tab === "active") return products.filter((p) => !isUnavailable(p));
    if (tab === "ended") return products.filter(isUnavailable);
    return products;
  }, [data, tab]);

  if (loading) return <ProfileSkeleton />;
  if (error) {
    return <ErrorState error={error} onRetry={reload} backLabel="Về trang chủ" />;
  }

  const { user, isOwner } = data;

  async function handleSave(patch) {
    const updated = await updateUserProfile(user._id, patch);
    setData((d) => ({ ...d, user: updated }));
    setEditing(false);
    show("Đã cập nhật hồ sơ");
  }

  return (
    <main className="cm-page cm-scope cm-container">
      <section className="cm-card cm-hero">
        <div className="cm-hero__cover" aria-hidden="true" />
        <div className="cm-hero__body">
          <Avatar src={user.avatar} name={user.name} size={112} className="cm-hero__avatar" />
          <div className="cm-hero__info">
            <h1>{user.name}</h1>
            <p className="cm-muted">
              {user.createdAt ? `Tham gia ${formatMonthYear(user.createdAt)}` : "Thành viên VLU Campus Market"}
            </p>
            <div className="cm-hero__chips">
              <span className="cm-chip"><Icon name="cap" size={14} /> Sinh viên VLU</span>
              <span className="cm-chip"><Icon name="box" size={14} /> {counts.all} tin đăng</span>
              <span className="cm-chip cm-chip--ok"><Icon name="check" size={14} /> {counts.active} đang bán</span>
            </div>
          </div>
          {isOwner && (
            <button type="button" className="cm-btn cm-btn--secondary cm-hero__edit" onClick={() => setEditing(true)}>
              <Icon name="edit" size={16} /> Chỉnh sửa hồ sơ
            </button>
          )}
        </div>
      </section>

      <div className="cm-profile__layout">
        <section className="cm-profile__posts" aria-labelledby="cm-posts-h">
          <div className="cm-posts__head">
            <h2 id="cm-posts-h">Tin đăng của {isOwner ? "bạn" : user.name}</h2>
            <div className="cm-tabs" role="tablist" aria-label="Lọc tin đăng">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  className={`cm-tab${tab === t.key ? " is-active" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label} <span className="cm-tab__n">{counts[t.key]}</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length ? (
            <div className="cm-grid">
              {visible.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="cm-card">
              <EmptyState icon="box" title={counts.all ? "Không có tin nào trong mục này" : "Chưa có tin đăng nào"}>
                {isOwner && !counts.all ? "Hãy đăng tin đầu tiên để bắt đầu bán đồ của bạn." : "Quay lại sau để xem thêm nhé."}
              </EmptyState>
            </div>
          )}
        </section>

        <aside className="cm-profile__side">
          <section className="cm-card cm-section">
            <h2>Giới thiệu</h2>
            {user.bio?.trim() ? (
              <p className="cm-desc">{user.bio}</p>
            ) : (
              <p className="cm-muted">
                {isOwner ? "Bạn chưa viết giới thiệu. Bấm “Chỉnh sửa hồ sơ” để thêm." : "Người dùng chưa viết giới thiệu."}
              </p>
            )}
          </section>

          <section className="cm-card cm-section">
            <h2>Thông tin liên hệ</h2>
            <div className="cm-rows">
              <RevealRow icon="phone" label="Số điện thoại" value={user.phone} kind="phone" reveal={isOwner} onCopied={show} />
              <RevealRow icon="mail" label="Email" value={user.email} kind="email" reveal={isOwner} onCopied={show} />
              <div className="cm-row">
                <span className="cm-row__icon"><Icon name="cap" size={18} /></span>
                <div className="cm-row__text">
                  <span className="cm-row__label">Mã số sinh viên</span>
                  <span className="cm-row__value">
                    {user.studentID ? (isOwner || showStudentID ? user.studentID : maskStudentID(user.studentID)) : "Chưa cập nhật"}
                  </span>
                </div>
                {user.studentID && !isOwner && !showStudentID && (
                  <button type="button" className="cm-link" onClick={() => setShowStudentID(true)}>Hiện</button>
                )}
              </div>
            </div>
          </section>

          {!isOwner && (
            <Link to="/" className="cm-btn cm-btn--ghost cm-btn--block">
              <Icon name="chevronLeft" size={16} /> Về trang chủ
            </Link>
          )}
        </aside>
      </div>

      {editing && <EditProfileModal user={user} onClose={() => setEditing(false)} onSave={handleSave} />}
      <Toast message={toast} />
    </main>
  );
}
