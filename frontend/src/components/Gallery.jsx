import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icons";

// Bộ ảnh của tin đăng: ảnh lớn + dải ảnh nhỏ + xem toàn màn hình (phím ← → và Esc).
// Hiện model chỉ có 1 ảnh (`img`); khi có nhiều ảnh thì dải ảnh nhỏ tự xuất hiện.
export default function Gallery({ images, alt, dimmed = false, overlayText = "" }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [broken, setBroken] = useState({});

  const count = images.length;
  const go = useCallback((delta) => setIndex((i) => (i + delta + count) % count), [count]);

  useEffect(() => {
    if (!zoom) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight" && count > 1) go(1);
      if (e.key === "ArrowLeft" && count > 1) go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // khoá cuộn nền khi đang xem ảnh lớn
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoom, count, go]);

  const current = images[index];
  const hasImage = count > 0 && !broken[index];

  return (
    <div className="cm-card cm-gallery">
      <div
        className={`cm-gallery__stage${dimmed ? " is-dim" : ""}`}
        onClick={() => hasImage && setZoom(true)}
        role={hasImage ? "button" : undefined}
        tabIndex={hasImage ? 0 : undefined}
        aria-label={hasImage ? "Phóng to ảnh" : undefined}
        onKeyDown={(e) => hasImage && (e.key === "Enter" || e.key === " ") && setZoom(true)}
      >
        {hasImage ? (
          <img src={current} alt={alt} onError={() => setBroken((b) => ({ ...b, [index]: true }))} />
        ) : (
          <div className="cm-noimg cm-noimg--lg">
            <Icon name="image" size={48} />
            <span>Chưa có hình ảnh</span>
          </div>
        )}
        {overlayText && <div className="cm-gallery__overlay">{overlayText}</div>}
        {hasImage && (
          <span className="cm-gallery__hint">
            <Icon name="search" size={14} /> Bấm để phóng to
          </span>
        )}
        {count > 1 && (
          <span className="cm-gallery__count">
            {index + 1}/{count}
          </span>
        )}
      </div>

      {count > 1 && (
        <div className="cm-gallery__thumbs" role="list">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              role="listitem"
              className="cm-thumb"
              aria-label={`Xem ảnh ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}

      {zoom && hasImage && (
        <div className="cm-lightbox" role="dialog" aria-modal="true" aria-label="Xem ảnh lớn" onClick={() => setZoom(false)}>
          <button type="button" className="cm-lightbox__close" aria-label="Đóng" onClick={() => setZoom(false)}>
            <Icon name="x" size={22} />
          </button>
          {count > 1 && (
            <button
              type="button"
              className="cm-lightbox__nav cm-lightbox__nav--prev"
              aria-label="Ảnh trước"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            >
              <Icon name="chevronLeft" size={26} />
            </button>
          )}
          <img src={current} alt={alt} onClick={(e) => e.stopPropagation()} />
          {count > 1 && (
            <button
              type="button"
              className="cm-lightbox__nav cm-lightbox__nav--next"
              aria-label="Ảnh sau"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            >
              <Icon name="chevron" size={26} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
