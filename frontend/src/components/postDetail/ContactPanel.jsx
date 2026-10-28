import { useState } from "react";
import { Icon } from "../detailShared/Icons";
import { copyText } from "../detailShared/utils/clipboard";
import { formatPhone, maskEmail, maskPhone } from "../detailShared/utils/format";

/**
 * Một dòng thông tin liên hệ. Mặc định che bớt, bấm "Hiện" mới thấy đầy đủ
 * (giảm việc bị thu thập số điện thoại / email hàng loạt).
 */
export function RevealRow({ icon, label, value, kind, reveal = false, onCopied, children }) {
  const [shown, setShown] = useState(reveal);

  if (!value) {
    return (
      <div className="cm-row cm-row--empty">
        <span className="cm-row__icon">
          <Icon name={icon} size={18} />
        </span>
        <div className="cm-row__text">
          <span className="cm-row__label">{label}</span>
          <span className="cm-row__value">Chưa cập nhật</span>
        </div>
      </div>
    );
  }

  const masked = kind === "phone" ? maskPhone(value) : maskEmail(value);
  const full = kind === "phone" ? formatPhone(value) : value;

  async function handleCopy() {
    const ok = await copyText(value);
    onCopied?.(ok ? `Đã sao chép ${label.toLowerCase()}` : "Không sao chép được, hãy chép thủ công");
  }

  return (
    <div className="cm-row">
      <span className="cm-row__icon">
        <Icon name={icon} size={18} />
      </span>
      <div className="cm-row__text">
        <span className="cm-row__label">{label}</span>
        <span className="cm-row__value">{shown ? full : masked}</span>
      </div>
      <div className="cm-row__actions">
        {shown ? (
          <>
            <button type="button" className="cm-iconbtn" aria-label={`Sao chép ${label.toLowerCase()}`} onClick={handleCopy}>
              <Icon name="copy" size={16} />
            </button>
            {children}
          </>
        ) : (
          <button type="button" className="cm-link" onClick={() => setShown(true)}>
            Hiện
          </button>
        )}
      </div>
    </div>
  );
}

/** Khối liên hệ người bán: bấm nút để mở ra số điện thoại / Zalo / email. */
export default function ContactPanel({ open, onToggle, phone, email, disabled = false, disabledText, onCopied }) {
  const hasContact = !!(phone || email);
  const digits = String(phone || "").replace(/\D/g, "");

  return (
    <div className="cm-contact">
      <button
        type="button"
        className="cm-btn cm-btn--primary cm-btn--block"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={open}
      >
        <Icon name="phone" size={18} />
        {disabled ? disabledText || "Tin không còn khả dụng" : open ? "Ẩn thông tin liên hệ" : "Liên hệ người bán"}
      </button>

      {open && !disabled && (
        <div className="cm-contact__panel">
          {hasContact ? (
            <>
              <RevealRow icon="phone" label="Số điện thoại" value={phone} kind="phone" reveal onCopied={onCopied}>
                <a className="cm-minibtn" href={`tel:${digits}`}>
                  Gọi
                </a>
                <a className="cm-minibtn" href={`https://zalo.me/${digits}`} target="_blank" rel="noreferrer">
                  Zalo
                </a>
              </RevealRow>
              <RevealRow icon="mail" label="Email" value={email} kind="email" reveal onCopied={onCopied}>
                <a className="cm-minibtn" href={`mailto:${email}`}>
                  Gửi
                </a>
              </RevealRow>
            </>
          ) : (
            <p className="cm-muted cm-contact__empty">Người bán chưa cung cấp thông tin liên hệ.</p>
          )}
        </div>
      )}
    </div>
  );
}
