import { useState } from "react";
import { initials } from "./utils/format";

// Màu nền ổn định cho từng người, tính từ tên (dùng khi chưa có ảnh đại diện).
function hueFromName(name = "") {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export default function Avatar({ src, name, size = 48, className = "" }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  if (src && !failed) {
    return (
      <img
        className={`cm-avatar ${className}`.trim()}
        style={style}
        src={src}
        alt={`Ảnh đại diện của ${name}`}
        onError={() => setFailed(true)}
      />
    );
  }
  const hue = hueFromName(name);
  return (
    <span
      className={`cm-avatar cm-avatar--fallback ${className}`.trim()}
      style={{ ...style, background: `hsl(${hue} 55% 90%)`, color: `hsl(${hue} 55% 28%)` }}
      role="img"
      aria-label={`Ảnh đại diện của ${name}`}
    >
      {initials(name)}
    </span>
  );
}
