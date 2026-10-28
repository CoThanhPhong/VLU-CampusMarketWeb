import { useEffect, useRef, useState } from "react";
import Avatar from "../detailShared/Avatar";
import { Icon } from "../detailShared/Icons";

const BIO_MAX = 200;
const PHONE_RE = /^(0|\+84)\d{9}$/;

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Họ tên không được để trống.";
  if (form.phone.trim() && !PHONE_RE.test(form.phone.replace(/\s+/g, ""))) {
    errors.phone = "Số điện thoại chưa đúng (ví dụ: 0901234567).";
  }
  if (form.avatar.trim() && !/^(https?:\/\/|data:image\/)/i.test(form.avatar.trim())) {
    errors.avatar = "Liên kết ảnh phải bắt đầu bằng http:// hoặc https://.";
  }
  if (form.bio.length > BIO_MAX) errors.bio = `Giới thiệu tối đa ${BIO_MAX} ký tự.`;
  return errors;
}

/** Form chỉnh sửa hồ sơ (chỉ chủ hồ sơ mới thấy nút mở form này). */
export default function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user.name ?? "",
    bio: user.bio ?? "",
    phone: user.phone ?? "",
    avatar: user.avatar?.startsWith("data:") ? "" : user.avatar ?? "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, saving]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setServerError("");
    try {
      await onSave({
        name: form.name.trim(),
        bio: form.bio.trim(),
        phone: form.phone.replace(/\s+/g, ""),
        // giữ nguyên ảnh cũ nếu ô liên kết để trống và ảnh cũ là ảnh nhúng
        avatar: form.avatar.trim() || (user.avatar?.startsWith("data:") ? user.avatar : ""),
      });
    } catch (err) {
      setServerError(err?.message || "Không lưu được, vui lòng thử lại.");
      setSaving(false);
    }
  }

  return (
    <div className="cm-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="cm-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="cm-edit-title" onSubmit={handleSubmit} noValidate>
        <div className="cm-modal__head">
          <h2 id="cm-edit-title">Chỉnh sửa hồ sơ</h2>
          <button type="button" className="cm-iconbtn" aria-label="Đóng" onClick={onClose} disabled={saving}>
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="cm-modal__body">
          <div className="cm-edit-avatar">
            <Avatar src={form.avatar.trim() || user.avatar} name={form.name || user.name} size={72} />
            <div className="cm-field cm-field--grow">
              <label htmlFor="cm-avatar">Liên kết ảnh đại diện</label>
              <input id="cm-avatar" type="url" placeholder="https://..." value={form.avatar} onChange={set("avatar")} aria-invalid={!!errors.avatar} />
              {errors.avatar && <p className="cm-field__error">{errors.avatar}</p>}
            </div>
          </div>

          <div className="cm-field">
            <label htmlFor="cm-name">Họ và tên *</label>
            <input id="cm-name" ref={firstRef} value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="cm-field__error">{errors.name}</p>}
          </div>

          <div className="cm-field">
            <label htmlFor="cm-phone">Số điện thoại</label>
            <input id="cm-phone" inputMode="tel" placeholder="0901234567" value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} />
            {errors.phone && <p className="cm-field__error">{errors.phone}</p>}
          </div>

          <div className="cm-field">
            <label htmlFor="cm-bio">
              Giới thiệu <span className={`cm-counter${form.bio.length > BIO_MAX ? " is-over" : ""}`}>{form.bio.length}/{BIO_MAX}</span>
            </label>
            <textarea id="cm-bio" rows={4} value={form.bio} onChange={set("bio")} aria-invalid={!!errors.bio} />
            {errors.bio && <p className="cm-field__error">{errors.bio}</p>}
          </div>

          <p className="cm-hint">
            Mã số sinh viên và email gắn với tài khoản nên không chỉnh sửa tại đây.
          </p>
          {serverError && (
            <div className="cm-alert cm-alert--bad" role="alert">
              <Icon name="alert" size={18} /> {serverError}
            </div>
          )}
        </div>

        <div className="cm-modal__foot">
          <button type="button" className="cm-btn cm-btn--ghost" onClick={onClose} disabled={saving}>
            Huỷ
          </button>
          <button type="submit" className="cm-btn cm-btn--primary" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
