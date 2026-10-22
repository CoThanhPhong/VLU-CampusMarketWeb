import { listingWindow } from "../utils/format";

// Huy hiệu trạng thái của tin: Còn hàng / Hết hàng / Hết hạn.
export default function StatusBadge({ product, size = "md" }) {
  const soldOut = product.status === "Hết hàng";
  const expired = listingWindow(product.startDate, product.endDate).expired;
  let tone = "ok";
  let text = "Còn hàng";
  if (soldOut) {
    tone = "gray";
    text = "Hết hàng";
  } else if (expired) {
    tone = "warn";
    text = "Hết hạn đăng";
  }
  return (
    <span className={`cm-badge cm-badge--${tone} cm-badge--${size}`}>
      <span className="cm-badge__dot" aria-hidden="true" />
      {text}
    </span>
  );
}
