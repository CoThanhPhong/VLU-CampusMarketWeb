import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPostDetail } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useSaved } from "../hooks/useSaved";
import { useToast } from "../hooks/useToast";
import { Icon, DeviceIcon } from "../components/Icons";
import Avatar from "../components/Avatar";
import StatusBadge from "../components/StatusBadge";
import Gallery from "../components/Gallery";
import ContactPanel from "../components/ContactPanel";
import ProductCard from "../components/ProductCard";
import Toast from "../components/Toast";
import { DetailSkeleton, ErrorState } from "../components/StateViews";
import {
  DEVICE_LABEL,
  formatDate,
  formatMonthYear,
  formatPrice,
  getImages,
  isUnavailable,
  listingWindow,
  shortId,
  timeAgo,
} from "../utils/format";

export default function PostDetailPage() {
  const { id } = useParams();
  const { data, error, loading, reload } = useAsync(() => getPostDetail(id), [id]);
  const { isSaved, toggle } = useSaved();
  const { toast, show } = useToast();
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    setContactOpen(false);
    window.scrollTo?.(0, 0);
  }, [id]);

  useEffect(() => {
    if (data?.product) document.title = `${data.product.name} | VLU Campus Market`;
  }, [data]);

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { product, seller, sellerPostCount, related } = data;
  const win = listingWindow(product.startDate, product.endDate);
  const unavailable = isUnavailable(product);
  const soldOut = product.status === "Hết hàng";
  const saved = isSaved(product._id);
  const overlay = soldOut ? "Đã hết hàng" : win.expired ? "Tin đã hết hạn đăng" : "";

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      show("Đã sao chép liên kết tin đăng");
    } catch {
      show("Không chia sẻ được, hãy sao chép liên kết trên thanh địa chỉ");
    }
  }

  const facts = [
    ["Loại thiết bị", DEVICE_LABEL[product.deviceType] ?? product.deviceType, product.deviceType],
    ["Số lượng", `${product.amount} sản phẩm`, "box"],
    ["Địa điểm giao dịch", product.local, "pin"],
    ["Ngày đăng", formatDate(product.startDate), "calendar"],
    ["Hạn đăng", product.endDate ? formatDate(product.endDate) : "Không giới hạn", "clock"],
    ["Mã tin", shortId(product._id), "tag"],
  ];

  return (
    <main className="cm-page cm-scope cm-container">
      <nav className="cm-crumbs" aria-label="Đường dẫn">
        <Link to="/">Trang chủ</Link>
        <Icon name="chevron" size={14} />
        <span>{DEVICE_LABEL[product.deviceType] ?? "Thiết bị"}</span>
        <Icon name="chevron" size={14} />
        <span className="cm-crumbs__cur">{product.name}</span>
      </nav>

      <div className="cm-detail">
        <div className="cm-detail__main">
          <Gallery images={getImages(product)} alt={product.name} dimmed={unavailable} overlayText={overlay} />

          <section className="cm-card cm-section">
            <h2>Mô tả sản phẩm</h2>
            {product.description?.trim() ? (
              <p className="cm-desc">{product.description}</p>
            ) : (
              <p className="cm-muted">Người bán chưa thêm mô tả cho tin này.</p>
            )}
          </section>

          <section className="cm-card cm-section">
            <h2>Thông tin chi tiết</h2>
            <dl className="cm-facts">
              {facts.map(([label, value, icon]) => (
                <div key={label} className="cm-fact">
                  <dt>
                    {["mobile", "tablet", "laptop", "mac"].includes(icon) ? <DeviceIcon type={icon} size={16} /> : <Icon name={icon} size={16} />}
                    {label}
                  </dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="cm-card cm-section cm-safety">
            <h2>
              <Icon name="shield" size={20} /> Giao dịch an toàn
            </h2>
            <ul>
              <li>Gặp mặt tại khuôn viên trường, nơi đông người và có bảo vệ.</li>
              <li>Kiểm tra kỹ máy (mở máy, thử pin, thử cảm ứng) trước khi thanh toán.</li>
              <li>Không chuyển khoản trước khi nhận hàng, nhất là với người chưa quen.</li>
            </ul>
          </section>
        </div>

        <aside className="cm-detail__side">
          <section className="cm-card cm-buybox">
            <div className="cm-buybox__top">
              <StatusBadge product={product} />
              <span className="cm-muted">Đăng {timeAgo(product.startDate)}</span>
            </div>
            <h1 className="cm-title">{product.name}</h1>
            <div className="cm-price">{formatPrice(product.price)}</div>
            <p className="cm-buybox__loc">
              <Icon name="pin" size={16} /> {product.local}
            </p>

            {win.hasEnd && (
              <div className={`cm-window${win.expired ? " is-expired" : win.daysLeft <= 3 ? " is-soon" : ""}`}>
                <div className="cm-window__label">
                  <Icon name="clock" size={15} /> {win.label}
                </div>
                <div className="cm-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(win.percent)} aria-label="Thời gian đăng đã qua">
                  <span style={{ width: `${win.percent}%` }} />
                </div>
              </div>
            )}

            <div className="cm-buybox__actions">
              <ContactPanel
                open={contactOpen}
                onToggle={() => setContactOpen((o) => !o)}
                phone={seller?.phone}
                email={seller?.email}
                disabled={unavailable || !seller}
                disabledText={!seller && !unavailable ? "Chưa có thông tin người bán" : soldOut ? "Sản phẩm đã hết hàng" : "Tin đã hết hạn đăng"}
                onCopied={show}
              />
              <div className="cm-buybox__row">
                <button type="button" className={`cm-btn cm-btn--secondary${saved ? " is-active" : ""}`} aria-pressed={saved} onClick={() => { toggle(product._id); show(saved ? "Đã bỏ lưu tin" : "Đã lưu tin"); }}>
                  <Icon name="heart" size={17} /> {saved ? "Đã lưu" : "Lưu tin"}
                </button>
                <button type="button" className="cm-btn cm-btn--secondary" onClick={share}>
                  <Icon name="share" size={17} /> Chia sẻ
                </button>
              </div>
            </div>
          </section>

          <section className="cm-card cm-seller">
            <h2 className="cm-seller__h">Người bán</h2>
            {seller ? (
              <>
                <Link to={`/users/${seller._id}`} className="cm-seller__who">
                  <Avatar src={seller.avatar} name={seller.name} size={52} />
                  <div>
                    <strong>{seller.name}</strong>
                    <span className="cm-muted">
                      {seller.createdAt ? `Tham gia ${formatMonthYear(seller.createdAt)}` : "Sinh viên VLU"}
                    </span>
                  </div>
                  <Icon name="chevron" size={18} />
                </Link>
                <div className="cm-seller__stats">
                  <span><Icon name="box" size={15} /> {sellerPostCount} tin đăng</span>
                  {seller.studentID && (
                    <span className="cm-verified"><Icon name="check" size={15} /> Sinh viên VLU</span>
                  )}
                </div>
                <Link to={`/users/${seller._id}`} className="cm-btn cm-btn--ghost cm-btn--block">
                  Xem trang cá nhân
                </Link>
              </>
            ) : (
              <p className="cm-muted">Tin này chưa gắn với tài khoản người bán.</p>
            )}
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="cm-related">
          <h2>Tin liên quan</h2>
          <div className="cm-grid cm-grid--4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {!unavailable && (
        <div className="cm-stickybar">
          <div>
            <strong>{formatPrice(product.price)}</strong>
            <span className="cm-muted">{product.local}</span>
          </div>
          <button
            type="button"
            className="cm-btn cm-btn--primary"
            disabled={!seller}
            onClick={() => {
              setContactOpen(true);
              document.querySelector(".cm-buybox")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <Icon name="phone" size={17} /> Liên hệ
          </button>
        </div>
      )}

      <Toast message={toast} />
    </main>
  );
}
