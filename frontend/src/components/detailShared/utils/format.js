// Các hàm định dạng dùng chung cho trang chi tiết bài đăng và trang cá nhân.

export const DEVICE_LABEL = {
  mobile: "Điện thoại",
  tablet: "Máy tính bảng",
  laptop: "Laptop",
  mac: "Mac",
};

const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? vnd.format(n) : "Liên hệ";
}

export function formatDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
}

export function formatMonthYear(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

/** "vừa xong", "5 phút trước", "3 giờ trước", "2 ngày trước"... */
export function timeAgo(value, now = Date.now()) {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return "vừa xong";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return formatDate(value);
}

/**
 * Thời hạn đăng tin (startDate -> endDate).
 * endDate là tuỳ chọn trong model nên có thể không có hạn.
 */
export function listingWindow(start, end, now = Date.now()) {
  const e = end ? new Date(end).getTime() : NaN;
  if (!Number.isFinite(e)) {
    return { hasEnd: false, expired: false, daysLeft: null, percent: 0, label: "Không giới hạn thời gian" };
  }
  const sRaw = new Date(start).getTime();
  const s = Number.isFinite(sRaw) ? sRaw : now;
  const msLeft = e - now;
  const expired = msLeft < 0;
  const daysLeft = expired ? 0 : Math.floor(msLeft / 86400000);
  const total = e - s;
  const percent = total > 0 ? Math.min(100, Math.max(0, ((now - s) / total) * 100)) : 100;
  let label = "Đã hết hạn";
  if (!expired) label = daysLeft < 1 ? "Còn dưới 1 ngày" : `Còn ${daysLeft} ngày`;
  return { hasEnd: true, expired, daysLeft, percent, label };
}

/** Tin không còn khả dụng: hết hàng hoặc quá hạn đăng. */
export function isUnavailable(product) {
  return product?.status === "Hết hàng" || listingWindow(product?.startDate, product?.endDate).expired;
}

/** Hỗ trợ cả `img` (chuỗi, nhiều ảnh cách nhau bằng dấu |) và `images` (mảng, dự phòng cho sau này). */
export function getImages(product) {
  const raw = Array.isArray(product?.images) && product.images.length ? product.images : product?.img;
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split("|");
  return list.map((s) => String(s).trim()).filter(Boolean);
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const last = parts[parts.length - 1][0];
  const first = parts.length > 1 ? parts[0][0] : "";
  return (first + last).toUpperCase();
}

export function formatPhone(phone = "") {
  const p = String(phone).replace(/\s+/g, "");
  return /^0\d{9}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : phone;
}

export function maskPhone(phone = "") {
  const p = String(phone).replace(/\s+/g, "");
  return p.length >= 7 ? `${p.slice(0, 4)} *** ${p.slice(-3)}` : "••••••";
}

export function maskEmail(email = "") {
  const [name = "", domain = ""] = String(email).split("@");
  if (!domain) return "••••••";
  return `${name.slice(0, 2)}${"*".repeat(Math.max(3, name.length - 2))}@${domain}`;
}

export function maskStudentID(id = "") {
  const s = String(id);
  return s.length > 4 ? `${"•".repeat(s.length - 4)}${s.slice(-4)}` : s;
}

export const shortId = (id = "") => `#${String(id).slice(-6).toUpperCase()}`;
