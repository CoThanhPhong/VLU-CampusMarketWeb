import { useState } from "react";
import { Link } from "react-router-dom";
import { DeviceIcon, Icon } from "./Icons";
import StatusBadge from "./StatusBadge";
import { DEVICE_LABEL, formatPrice, getImages, isUnavailable, timeAgo } from "../utils/format";

// Thẻ tin đăng dùng ở "Tin cùng loại" (trang chi tiết) và danh sách tin của người bán (trang cá nhân).
export default function ProductCard({ product }) {
  const [broken, setBroken] = useState(false);
  const image = getImages(product)[0];
  const dim = isUnavailable(product);

  return (
    <Link to={`/products/${product._id}`} className={`cm-pcard${dim ? " is-dim" : ""}`}>
      <div className="cm-pcard__img">
        {image && !broken ? (
          <img src={image} alt={product.name} loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="cm-noimg">
            <Icon name="image" size={32} />
          </div>
        )}
        <span className="cm-pcard__type">
          <DeviceIcon type={product.deviceType} size={14} />
          {DEVICE_LABEL[product.deviceType] ?? product.deviceType}
        </span>
        <span className="cm-pcard__status">
          <StatusBadge product={product} size="sm" />
        </span>
      </div>
      <div className="cm-pcard__body">
        <h3 className="cm-pcard__title">{product.name}</h3>
        <div className="cm-pcard__price">{formatPrice(product.price)}</div>
        <div className="cm-pcard__meta">
          <span>
            <Icon name="pin" size={13} /> {product.local}
          </span>
          <span>{timeAgo(product.startDate)}</span>
        </div>
      </div>
    </Link>
  );
}
