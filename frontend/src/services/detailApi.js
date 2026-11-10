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
  const result = await request(`/products/g?id=${encodeURIComponent(productId)}`);
  const product = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!product) throw new Error("Không tìm thấy bài đăng.");
  return product;
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
