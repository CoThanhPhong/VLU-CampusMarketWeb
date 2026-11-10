const API_BASE = "/api";

function readToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
}

async function request(url, options = {}) {
  const token = readToken();
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    throw new Error(payload.message || `Yêu cầu thất bại (${response.status})`);
  }
  return payload;
}

export async function getProducts() {
  const result = await request("/products/g");
  return Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
}

export async function getProductDetail(productId) {
  if (!productId) throw new Error("ID sản phẩm không hợp lệ.");
  
  // Sửa lại gọi đúng endpoint chi tiết theo ID của MongoDB: /products/g/{id}
  // Hoặc lọc chuẩn xác trong mảng trả về nếu backend dùng chung endpoint liệt kê
  try {
    const result = await request(`/products/g/${productId}`);
    const product = result.data || result;
    if (product) return product;
  } catch (err) {
    // Fallback: Nếu backend yêu cầu gọi danh sách rồi tìm theo id
    const allProducts = await getProducts();
    const found = allProducts.find(p => String(p._id || p.id) === String(productId));
    if (found) return found;
  }

  throw new Error("Không tìm thấy bài đăng.");
}

export async function getUserDetail(userId) {
  const result = await request("/auth/user", {
    method: "POST",
    body: JSON.stringify({ id: userId }),
  });
  return result.data;
}

export function getProductOwnerId(product) {
  const author = product?.author;
  return String(author?._id || author?.id || author || "");
}

export function normalizeUser(user) {
  const profile = user?.profile && typeof user.profile === "object" ? user.profile : {};
  return {
    id: String(user?._id || user?.id || profile?.userID || ""),
    name: profile.name || user?.name || "Người dùng Campus",
    email: profile.email || user?.email || "",
    mssv: profile.mssv || "",
    phone: profile.phone || "",
    avatar: profile.avatar || "",
    bio: profile.bio || "Chưa có giới thiệu.",
    createdAt: user?.createdAt || profile?.createdAt || null,
  };
}