import { useCallback, useState } from "react";

// "Lưu tin" được ghi trong localStorage của trình duyệt (chưa cần backend).
const KEY = "cm_saved_posts";

function read() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function useSaved() {
  const [ids, setIds] = useState(read);

  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* bỏ qua nếu trình duyệt chặn lưu trữ */
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((id) => ids.includes(id), [ids]);
  return { isSaved, toggle };
}
