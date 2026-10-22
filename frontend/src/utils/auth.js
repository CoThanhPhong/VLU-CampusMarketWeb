// Đọc id người dùng đang đăng nhập từ JWT mà backend trả về ở /api/auth/login.
// Token có dạng { id, name } (xem backend/controllers/authController.js).
// Nếu nhóm lưu token dưới tên khác trong localStorage thì chỉ cần đổi TOKEN_KEY.

export const TOKEN_KEY = "token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getCurrentUserId() {
  const token = getToken();
  if (!token) return null;
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null; // token hết hạn
    return payload.id ?? null;
  } catch {
    return null;
  }
}
