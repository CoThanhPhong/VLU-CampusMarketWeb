import { useCallback, useEffect, useRef, useState } from "react";

// Thông báo nhỏ ở cuối màn hình. Dùng cùng component <Toast message={toast} />.
export function useToast(duration = 2400) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback(
    (message) => {
      setToast(message);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  useEffect(() => () => clearTimeout(timer.current), []);
  return { toast, show };
}
