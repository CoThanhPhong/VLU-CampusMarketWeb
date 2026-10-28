// Lớp gọi API riêng của phần Chi tiết bài đăng + Thông tin người dùng
//
// Đang dùng API gốc: GET /api/products/g (không body -> toàn bộ danh sách).
//   - GET /api/users/g?userID=<id>   -> { data: userDetail }
//   - PUT /api/users/u               -> body { userID, name, bio, phone, avatar }
//   - trường `seller` (id người đăng) trong model product

import axios from "axios";
import { getCurrentUserId, getToken } from "../components/detailShared/utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const http = axios.create({ baseURL: API_URL, timeout: 10000 });

// Gửi token đăng nhập (nếu có) theo đúng middleware backend: "Authorization: Bearer <token>".
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function toApiError(err, fallback) {
  if (err instanceof ApiError) return err;
  const status = err?.response?.status ?? 0;
  const message =
    err?.response?.data?.message ||
    (status === 0 ? "Không kết nối được tới máy chủ. Hãy kiểm tra backend đã chạy chưa." : fallback);
  return new ApiError(message, status);
}

const idOf = (x) => (x && typeof x === "object" ? x._id : x) ?? null;
/** Id người đăng của một tin (null nếu model product chưa có trường `seller`). */
export const sellerIdOf = (product) => idOf(product?.seller);

/** Chuẩn hoá một bản ghi userDetail về dạng dùng trong giao diện. */
function normalizeUser(d) {
  if (!d) throw new ApiError("Không tìm thấy người dùng này.", 404);
  return {
    _id: d.userID ?? d._id,
    name: d.name ?? "",
    bio: d.bio ?? "",
    email: d.email ?? "",
    avatar: d.avatar ?? "",
    phone: d.phone ?? "",
    studentID: d.studentID ?? "",
    createdAt: d.createdAt,
  };
}

// ---- Sản phẩm ----

export async function getProducts() {
  try {
    const res = await http.get("/products/g");
    return res.data.data ?? [];
  } catch (err) {
    throw toApiError(err, "Không tải được danh sách tin đăng.");
  }
}

// ---- Người dùng ----

export async function getUserProfile(id) {
  try {
    const res = await http.get("/users/g", { params: { userID: id } });
    return normalizeUser(res.data.data);
  } catch (err) {
    throw toApiError(err, "Không tải được thông tin người dùng.");
  }
}

export async function updateUserProfile(id, patch) {
  try {
    const res = await http.put("/users/u", { userID: id, ...patch });
    return normalizeUser(res.data.data);
  } catch (err) {
    throw toApiError(err, "Không cập nhật được hồ sơ.");
  }
}

// ---- Dữ liệu theo từng trang ----

/**
 * Trang chi tiết bài đăng. API gốc lấy 1 sản phẩm bằng GET kèm body {_id}, mà trình duyệt không gửi
 * được body với GET, nên lấy cả danh sách rồi tìm theo _id.
 */
export async function getPostDetail(id) {
  const products = await getProducts();
  const product = products.find((p) => String(p._id) === String(id));
  if (!product) throw new ApiError("Không tìm thấy tin đăng này.", 404);

  const sid = sellerIdOf(product);
  let seller = null;
  if (product.seller && typeof product.seller === "object") {
    seller = normalizeUser(product.seller);
  } else if (sid) {
    try {
      seller = await getUserProfile(sid);
    } catch {
      seller = null; // không lấy được người bán thì vẫn hiển thị tin
    }
  }
  const sellerPostCount = sid ? products.filter((p) => sellerIdOf(p) === sid).length : 0;

  const candidates = products.filter((p) => p._id !== product._id && p.status === "Còn hàng");
  const related = [
    ...candidates.filter((p) => p.deviceType === product.deviceType),
    ...candidates.filter((p) => p.deviceType !== product.deviceType),
  ].slice(0, 4);

  return { product, seller, sellerPostCount, related };
}

/** Trang cá nhân. id = "me" là hồ sơ của người đang đăng nhập (đọc id từ token). */
export async function getProfilePage(id) {
  const current = getCurrentUserId();
  let userId = id;
  let isOwner;

  if (id === "me") {
    if (!current) throw new ApiError("Bạn cần đăng nhập để xem hồ sơ của mình.", 401);
    userId = current;
    isOwner = true;
  } else {
    isOwner = !!current && String(current) === String(id);
  }

  const [user, products] = await Promise.all([getUserProfile(userId), getProducts()]);
  return {
    user,
    isOwner,
    products: products.filter((p) => sellerIdOf(p) === String(user._id)),
  };
}
