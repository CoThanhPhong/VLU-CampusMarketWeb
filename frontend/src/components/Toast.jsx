// Hiển thị thông báo từ hook useToast. Luôn render vùng aria-live để trình đọc màn hình đọc được.
export default function Toast({ message }) {
  return (
    <div className="cm-toast-host" aria-live="polite" role="status">
      {message && <div className="cm-toast">{message}</div>}
    </div>
  );
}
