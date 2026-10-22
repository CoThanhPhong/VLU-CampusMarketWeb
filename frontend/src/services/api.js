// Lớp gọi API duy nhất của 2 trang. Các trang KHÔNG gọi axios trực tiếp, nên khi backend đổi
// chỉ cần sửa file này.
//
// Chế độ dữ liệu:
//   VITE_USE_MOCK=true  (mặc định)  -> dùng dữ liệu mẫu trong src/mocks/data.js
//   VITE_USE_MOCK=false             -> gọi backend thật (VITE_API_URL, mặc định http://localhost:5000/api)

import axios from "axios";
import { MOCK_PRODUCTS, MOCK_USERS } from "../mocks/data";
import { getCurrentUserId } from "../utils/auth";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const http = axios.create({ baseURL: API_URL, timeout: 10000 });

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

// ---- Trạng thái dữ liệu mẫu (nằm trong bộ nhớ, tải lại trang là về ban đầu) ----
const mockUsers = MOCK_USERS.map((u) => ({ ...u }));
const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const idOf = (x) => (x && typeof x === "object" ? x._id : x) ?? null;
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
    role: d.role ?? "user",
    createdAt: d.createdAt,
  };
}

// ---------------------------------------------------------------------------
// SẢN PHẨM
// ---------------------------------------------------------------------------

/** GET /api/products/g  (không body -> trả về toàn bộ danh sách) */
export async function getProducts() {
  if (USE_MOCK) {
    await wait();
    return MOCK_PRODUCTS.map((p) => ({ ...p }));
  }
  try {
    const res = await http.get("/products/g");
    return res.data.data ?? [];
  } catch (err) {
    throw toApiError(err, "Không tải được danh sách tin đăng.");
  }
}

// ---------------------------------------------------------------------------
// NGƯỜI DÙNG  (backend chưa có -> xem HUONG_DAN_TICH_HOP.md để biết API đề xuất)
// ---------------------------------------------------------------------------

/** GET /api/users/g?_id=<userID>  (đề xuất) */
export async function getUserProfile(id) {
  if (USE_MOCK) {
    await wait(200);
    const user = mockUsers.find((u) => u._id === id);
    if (!user) throw new ApiError("Không tìm thấy người dùng này.", 404);
    return { ...user };
  }
  try {
    const res = await http.get("/users/g", { params: { _id: id } });
    return normalizeUser(res.data.data);
  } catch (err) {
    throw toApiError(err, "Không tải được thông tin người dùng.");
  }
}

/** PUT /api/users/u  body { _id, name, bio, phone, avatar }  (đề xuất) */
export async function updateUserProfile(id, patch) {
  if (USE_MOCK) {
    await wait(400);
    const user = mockUsers.find((u) => u._id === id);
    if (!user) throw new ApiError("Không tìm thấy người dùng này.", 404);
    Object.assign(user, patch);
    return { ...user };
  }
  try {
    const res = await http.put("/users/u", { _id: id, ...patch });
    return normalizeUser(res.data.data);
  } catch (err) {
    throw toApiError(err, "Không cập nhật được hồ sơ.");
  }
}

// ---------------------------------------------------------------------------
// DỮ LIỆU THEO TỪNG TRANG
// ---------------------------------------------------------------------------

/**
 * Dữ liệu cho trang chi tiết bài đăng.
 *
 * Lưu ý: API hiện tại lấy 1 sản phẩm bằng GET kèm body {_id} (chạy được trên Postman) nhưng
 * trình duyệt KHÔNG gửi được body với GET. Vì vậy ở đây lấy cả danh sách rồi tìm theo _id.
 * Khi backend có GET /products/g?_id=... thì thay đoạn tìm này bằng 1 lần gọi riêng.
 */
export async function getPostDetail(id) {
  const products = await getProducts();
  const product = products.find((p) => String(p._id) === String(id));
  if (!product) throw new ApiError("Không tìm thấy tin đăng này.", 404);

  // `seller` có thể là id, object đã populate, hoặc chưa có (model hiện tại chưa có trường này).
  const sid = sellerIdOf(product);
  let seller = null;
  if (product.seller && typeof product.seller === "object") {
    seller = normalizeUser(product.seller);
  } else if (sid) {
    try {
      seller = await getUserProfile(sid);
    } catch {
      seller = null; // không có thông tin người bán thì vẫn hiển thị tin
    }
  }

  const sellerPostCount = sid ? products.filter((p) => sellerIdOf(p) === sid).length : 0;

  // Tin liên quan: ưu tiên cùng loại thiết bị, chỉ lấy tin còn hàng, tối đa 4.
  const candidates = products.filter((p) => p._id !== product._id && p.status === "Còn hàng");
  const related = [
    ...candidates.filter((p) => p.deviceType === product.deviceType),
    ...candidates.filter((p) => p.deviceType !== product.deviceType),
  ].slice(0, 4);

  return { product, seller, sellerPostCount, related };
}

/** Dữ liệu cho trang cá nhân. id = "me" nghĩa là hồ sơ của người đang đăng nhập. */
export async function getProfilePage(id) {
  const current = getCurrentUserId();
  let userId = id;
  let isOwner = false;

  if (id === "me") {
    if (current) {
      userId = current;
    } else if (USE_MOCK) {
      userId = mockUsers[0]._id; // chưa đăng nhập: dùng hồ sơ mẫu đầu tiên để xem thử
    } else {
      throw new ApiError("Bạn cần đăng nhập để xem hồ sơ của mình.", 401);
    }
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
